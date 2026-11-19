import axios from 'axios';
import { useSyncExternalStore } from 'react';
import { mockApi } from './mockApi';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const SESSION_KEY = 'foodie_seller_session';

// ---------------------------------------------------------------------------
// Session (sellerId, restaurantName, JWT token...) in localStorage
// ---------------------------------------------------------------------------
export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}
export function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* storage unavailable */ }
}
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch { /* storage unavailable */ }
}

// ---------------------------------------------------------------------------
// Demo-data fallback: when the gateway / Spring Boot / MySQL can't be reached the app keeps working
// against an in-memory mock until the next logout.
// ---------------------------------------------------------------------------
let mockMode = getSession()?.mock === true;
const listeners = new Set();

export function setMockMode(value) {
  if (mockMode === value) return;
  mockMode = value;
  listeners.forEach((l) => l());
}
export const isMockMode = () => mockMode;
export function useMockMode() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => mockMode
  );
}

// ---------------------------------------------------------------------------
// Axios instance -> Node.js gateway (port 5000)
// ---------------------------------------------------------------------------
const http = axios.create({ baseURL: BASE_URL, timeout: 8000 });

http.interceptors.request.use((config) => {
  const token = getSession()?.token;
  if (token && !mockMode) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthCall = url.startsWith('/api/auth/login') || url.startsWith('/api/auth/register');
    if (err.response?.status === 401 && !isAuthCall) {
      clearSession();
      window.dispatchEvent(new Event('foodie:unauthorized'));
    }
    return Promise.reject(err);
  }
);

const isBackendDown = (err) => !err.response || [502, 503, 504].includes(err.response.status);

async function call(real, mock) {
  if (mockMode) return mock();
  try {
    return await real();
  } catch (err) {
    if (isBackendDown(err)) {
      setMockMode(true);
      return mock();
    }
    throw err;
  }
}

const sid = () => getSession()?.sellerId;
const seller = (path = '') => `/api/seller/${sid()}${path}`;
const body = (promise) => promise.then((r) => r.data);

// ---------------------------------------------------------------------------
// Public API used by the UI
// ---------------------------------------------------------------------------
export const api = {
  login: (identifier, password) =>
    call(() => body(http.post('/api/auth/login', { identifier, password })), () => mockApi.login(identifier, password)),

  register: (payload) =>
    call(() => body(http.post('/api/auth/register', payload)), () => mockApi.register(payload)),

  logout: () => call(() => body(http.post('/api/auth/logout')), () => mockApi.logout()),

  getSummary: () => call(() => body(http.get(seller('/summary'))), () => mockApi.summary()),

  /** group: pending | active | queue | history | all */
  getOrders: (group = 'all') =>
    call(() => body(http.get(seller('/orders'), { params: { group } })), () => mockApi.orders(group)),

  updateOrderStatus: (orderId, status) =>
    call(() => body(http.put(seller(`/orders/${orderId}/status`), { status })), () => mockApi.updateOrderStatus(orderId, status)),

  simulateOrder: () => call(() => body(http.post(seller('/orders/simulate'))), () => mockApi.simulateOrder()),

  getMenu: () => call(() => body(http.get(seller('/menu'))), () => mockApi.menu()),

  addMenuItem: (item) => call(() => body(http.post(seller('/menu'), item)), () => mockApi.addMenuItem(item)),

  updateMenuItem: (id, item) =>
    call(() => body(http.put(seller(`/menu/${id}`), item)), () => mockApi.updateMenuItem(id, item)),

  setStock: (id, inStock) =>
    call(() => body(http.patch(seller(`/menu/${id}/stock`), { inStock })), () => mockApi.setStock(id, inStock)),

  deleteMenuItem: (id) => call(() => body(http.delete(seller(`/menu/${id}`))), () => mockApi.deleteMenuItem(id)),

  uploadImage: (file) =>
    call(() => {
      const form = new FormData();
      form.append('image', file);
      return body(http.post('/api/upload', form, { timeout: 20000 }));
    }, () => mockApi.uploadImage(file)),

  getEarnings: () => call(() => body(http.get(seller('/earnings'))), () => mockApi.earnings()),

  requestPayout: () => call(() => body(http.post(seller('/payouts/request'))), () => mockApi.requestPayout()),

  getProfile: () => call(() => body(http.get(seller('/profile'))), () => mockApi.profile()),

  updateProfile: (profile) =>
    call(() => body(http.put(seller('/profile'), profile)), () => mockApi.updateProfile(profile)),

  setOnline: (online) =>
    call(() => body(http.patch(seller('/online'), { online })), () => mockApi.setOnline(online)),
};
