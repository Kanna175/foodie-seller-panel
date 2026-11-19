'use strict';

/**
 * Foodie Seller Panel - Node.js gateway (BFF), port 5000
 *
 *   React (5173)  -->  this gateway (5000)  -->  Spring Boot (8080)  -->  MySQL
 *
 * Responsibilities:
 *   - /api/auth/*     login / register / logout (issues + revokes JWTs)
 *   - /api/upload     dish image upload (Multer) and /uploads static serving
 *   - /api/seller/*   authenticated proxy to Spring Boot; a seller can only touch their own data
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Config (override with environment variables)
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT) || 5000;
const SPRING_URL = process.env.SPRING_URL || 'http://localhost:8080';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const INTERNAL_KEY = process.env.INTERNAL_KEY || 'foodie-internal-dev-key'; // must match foodie.internal-key
const CORS_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const TOKEN_TTL = process.env.TOKEN_TTL || '8h';
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

if (process.env.NODE_ENV === 'production' &&
  (JWT_SECRET === 'dev-only-secret-change-me' || INTERNAL_KEY === 'foodie-internal-dev-key')) {
  console.error('Refusing to start: set JWT_SECRET and INTERNAL_KEY in production.');
  process.exit(1);
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// App + clients
// ---------------------------------------------------------------------------
const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json({ limit: '100kb' }));

const spring = axios.create({
  baseURL: SPRING_URL,
  timeout: 10000,
  headers: { 'X-Internal-Key': INTERNAL_KEY },
  validateStatus: () => true, // we forward whatever Spring answers
});

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------------------------------------------------------------------------
// JWT helpers + logout revocation (in-memory; use Redis if you run several gateway instances)
// ---------------------------------------------------------------------------
const revoked = new Map(); // jti -> expiry (ms)
setInterval(() => {
  const now = Date.now();
  for (const [jti, exp] of revoked) if (exp <= now) revoked.delete(jti);
}, 10 * 60 * 1000).unref();

function issueSession(s) {
  const token = jwt.sign(
    { sellerId: s.sellerId, restaurantName: s.restaurantName },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL, jwtid: crypto.randomUUID() }
  );
  return {
    token,
    sellerId: s.sellerId,
    restaurantName: s.restaurantName,
    storeId: s.storeId,
    online: s.online,
  };
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in to continue' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (revoked.has(payload.jti)) throw new Error('revoked');
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
}

// Basic brute-force protection for login/register: 10 attempts / 15 min / IP
const attempts = new Map();
function authLimiter(req, res, next) {
  const now = Date.now();
  const entry = attempts.get(req.ip);
  if (!entry || entry.resetAt <= now) {
    attempts.set(req.ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return next();
  }
  if (++entry.count > 10) {
    return res.status(429).json({ message: 'Too many attempts. Try again in a few minutes.' });
  }
  return next();
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, e] of attempts) if (e.resetAt <= now) attempts.delete(ip);
}, 15 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get('/api/health', wrap(async (req, res) => {
  let core = 'down';
  try {
    const r = await spring.get('/actuator/health', { timeout: 2000 });
    core = r.status ? 'up' : 'down'; // any HTTP answer means Spring is reachable
  } catch { /* stays down */ }
  res.json({ gateway: 'up', core });
}));

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
app.post('/api/auth/login', authLimiter, wrap(async (req, res) => {
  const { identifier, password } = req.body || {};
  const r = await spring.post('/api/seller/login', {
    identifier: String(identifier || ''),
    password: String(password || ''),
  });
  if (r.status !== 200) return res.status(r.status).json(r.data);
  return res.json(issueSession(r.data));
}));

app.post('/api/auth/register', authLimiter, wrap(async (req, res) => {
  const b = req.body || {};
  const r = await spring.post('/api/seller/register', {
    restaurantName: String(b.restaurantName || ''),
    ownerName: String(b.ownerName || ''),
    email: String(b.email || ''),
    phone: String(b.phone || ''),
    password: String(b.password || ''),
  });
  if (r.status !== 201) return res.status(r.status).json(r.data);
  return res.status(201).json(issueSession(r.data));
}));

app.post('/api/auth/logout', requireAuth, (req, res) => {
  revoked.set(req.auth.jti, req.auth.exp * 1000);
  res.json({ message: 'Logged out' });
});

// ---------------------------------------------------------------------------
// Dish image upload (Multer)
// ---------------------------------------------------------------------------
const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + EXT_BY_MIME[file.mimetype]),
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) return cb(null, true);
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image'));
  },
});

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', index: false }));

app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Attach an image in the "image" field' });
  return res.status(201).json({ url: `${PUBLIC_URL}/uploads/${req.file.filename}` });
});

// ---------------------------------------------------------------------------
// Proxy: /api/seller/{sellerId}/...  ->  Spring Boot
// ---------------------------------------------------------------------------
app.use('/api/seller', requireAuth, wrap(async (req, res) => {
  // req.url here is everything after /api/seller, e.g. "/1/orders?group=queue"
  const m = req.path.match(/^\/(\d+)(\/|$)/);
  if (!m || Number(m[1]) !== Number(req.auth.sellerId)) {
    return res.status(403).json({ message: 'You can only access your own restaurant' });
  }
  const hasBody = !['GET', 'HEAD', 'DELETE'].includes(req.method);
  const r = await spring.request({
    method: req.method,
    url: `/api/seller${req.url}`,
    data: hasBody ? req.body : undefined,
  });
  if (r.status === 204 || r.data === '' || r.data === undefined) return res.sendStatus(r.status);
  return res.status(r.status).json(r.data);
}));

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Image must be 5 MB or smaller'
      : 'Only JPG, PNG or WebP images are allowed';
    return res.status(400).json({ message });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON' });
  if (['ECONNREFUSED', 'ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND'].includes(err.code)) {
    return res.status(502).json({ message: 'Core service is unavailable' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Unexpected gateway error' });
});

app.listen(PORT, () => {
  console.log(`Foodie gateway listening on :${PORT} -> ${SPRING_URL}`);
});
