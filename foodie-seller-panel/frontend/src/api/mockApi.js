// In-memory implementation of the same API the gateway exposes. It enforces the same rules as the
// Spring Boot service (status transitions, KPI maths) so the UI behaves identically offline.

import { createMockStore, DEMO_CUSTOMERS, DEMO_LOGIN } from './mockData';

const store = createMockStore();

const TRANSITIONS = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['DELIVERED'],
};
const ACTIVE = ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'];
const HISTORY = ['DELIVERED', 'CANCELLED', 'REJECTED'];

const clone = (v) => JSON.parse(JSON.stringify(v));
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(clone(value)), 140));

function fail(status, message) {
  const err = new Error(message);
  err.response = { status, data: { message } };
  return Promise.reject(err);
}

const session = () => ({
  sellerId: store.seller.id,
  restaurantName: store.seller.restaurantName,
  storeId: store.seller.storeId,
  online: store.seller.online,
  token: 'mock-token',
});

const sum = (list) => list.reduce((s, o) => s + o.total, 0);

export const mockApi = {
  login(identifier, password) {
    const id = String(identifier || '').trim().toLowerCase();
    const ok = (id === DEMO_LOGIN.identifier || id === store.seller.phone) && password === DEMO_LOGIN.password;
    return ok ? delay(session()) : fail(401, 'Invalid mobile/email or password (demo: demo@foodie.in / demo123)');
  },

  register(payload) {
    store.seller.restaurantName = payload.restaurantName;
    store.seller.ownerName = payload.ownerName;
    store.seller.email = payload.email;
    store.seller.phone = payload.phone;
    return delay(session());
  },

  logout: () => delay({ message: 'Logged out' }),

  summary() {
    const delivered = store.orders.filter((o) => o.status === 'DELIVERED');
    return delay({
      totalAmount: sum(delivered.filter((o) => o.settled)),
      pendingAmount: sum(delivered.filter((o) => !o.settled)),
      activeOrders: store.orders.filter((o) => ACTIVE.includes(o.status)).length,
      pendingOrders: store.orders.filter((o) => o.status === 'PENDING').length,
    });
  },

  orders(group = 'all') {
    const byTime = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
    let list;
    switch (group) {
      case 'pending': list = store.orders.filter((o) => o.status === 'PENDING').sort(byTime); break;
      case 'active': list = store.orders.filter((o) => ACTIVE.includes(o.status)).sort(byTime); break;
      case 'queue':
        list = store.orders.filter((o) => o.status === 'PENDING' || ACTIVE.includes(o.status)).sort(byTime);
        break;
      case 'history':
        list = store.orders.filter((o) => HISTORY.includes(o.status)).sort((a, b) => byTime(b, a));
        break;
      default: list = [...store.orders].sort((a, b) => byTime(b, a));
    }
    return delay(list);
  },

  updateOrderStatus(orderId, status) {
    const order = store.orders.find((o) => o.id === orderId);
    if (!order) return fail(404, 'Order not found');
    if (!(TRANSITIONS[order.status] || []).includes(status)) {
      return fail(409, `Cannot move order from ${order.status} to ${status}`);
    }
    order.status = status;
    order.updatedAt = new Date().toISOString();
    return delay(order);
  },

  simulateOrder() {
    const available = store.menu.filter((m) => m.inStock);
    if (!available.length) return fail(400, 'Add at least one in-stock dish first');
    const picks = [...available].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
    const items = picks.map((m) => ({ name: m.name, quantity: 1 + Math.floor(Math.random() * 2), price: m.price }));
    const itemTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const id = store.nextOrderId++;
    const order = {
      id,
      orderNumber: `FD${10000 + id}`,
      sellerId: 1,
      customerName: DEMO_CUSTOMERS[Math.floor(Math.random() * DEMO_CUSTOMERS.length)],
      paymentMode: ['UPI', 'CARD', 'COD'][Math.floor(Math.random() * 3)],
      items,
      itemTotal,
      packagingCharge: store.seller.packagingCharge,
      total: itemTotal + Number(store.seller.packagingCharge),
      status: 'PENDING',
      settled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.orders.push(order);
    return delay(order);
  },

  // ---- menu ----
  menu: () => delay([...store.menu].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))),

  addMenuItem(body) {
    const item = { ...body, id: store.nextMenuId++, sellerId: 1, inStock: body.inStock ?? true };
    store.menu.push(item);
    return delay(item);
  },

  updateMenuItem(id, body) {
    const item = store.menu.find((m) => m.id === id);
    if (!item) return fail(404, 'Dish not found');
    Object.assign(item, body, { inStock: body.inStock ?? item.inStock });
    return delay(item);
  },

  setStock(id, inStock) {
    const item = store.menu.find((m) => m.id === id);
    if (!item) return fail(404, 'Dish not found');
    item.inStock = inStock;
    return delay(item);
  },

  deleteMenuItem(id) {
    const idx = store.menu.findIndex((m) => m.id === id);
    if (idx < 0) return fail(404, 'Dish not found');
    store.menu.splice(idx, 1);
    return delay(null);
  },

  uploadImage(file) {
    // Blob URL is enough for the demo; the real gateway returns a hosted /uploads/... URL.
    return delay({ url: URL.createObjectURL(file) });
  },

  // ---- earnings ----
  earnings() {
    const delivered = store.orders.filter((o) => o.status === 'DELIVERED');
    return delay({
      totalAmount: sum(delivered.filter((o) => o.settled)),
      pendingAmount: sum(delivered.filter((o) => !o.settled)),
      payouts: [...store.payouts].sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)),
    });
  },

  requestPayout() {
    const due = store.orders.filter((o) => o.status === 'DELIVERED' && !o.settled);
    if (!due.length) return fail(400, 'No pending amount to settle');
    due.forEach((o) => { o.settled = true; });
    store.payouts.push({
      id: store.nextPayoutId++,
      sellerId: 1,
      amount: sum(due),
      orderCount: due.length,
      status: 'PROCESSED',
      reference: `PO${Date.now()}`,
      paidAt: new Date().toISOString(),
    });
    return mockApi.earnings();
  },

  // ---- profile ----
  profile: () => delay(store.seller),

  updateProfile(body) {
    Object.assign(store.seller, body);
    return delay(store.seller);
  },

  setOnline(online) {
    store.seller.online = online;
    return delay(session());
  },
};
