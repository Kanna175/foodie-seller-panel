// Pre-populated demo data. Used automatically when the gateway / Spring Boot / MySQL are not reachable,
// so every screen works out of the box. Mirrors the data the Spring Boot seeder creates.

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (ms) => new Date(Date.now() - ms).toISOString();

export const DEMO_LOGIN = { identifier: 'demo@foodie.in', password: 'demo123' };

export function createMockStore() {
  const seller = {
    id: 1,
    restaurantName: 'Spice Garden Kitchen',
    ownerName: 'Kumar',
    email: 'demo@foodie.in',
    phone: '9876543210',
    storeId: 'FD-1001',
    address: 'Beach Road, Visakhapatnam, Andhra Pradesh',
    cuisine: 'North Indian, Biryani, Chinese',
    openingTime: '10:00',
    closingTime: '23:00',
    packagingCharge: 12,
    online: true,
  };

  const dish = (id, name, description, price, category, veg, inStock = true) => ({
    id, sellerId: 1, name, description, price, category, veg, inStock, imageUrl: null,
  });

  const menu = [
    dish(1, 'Paneer Tikka', 'Smoky tandoori cottage cheese cubes', 249, 'Starters', true),
    dish(2, 'Chicken 65', 'Spicy deep-fried chicken bites', 279, 'Starters', false),
    dish(3, 'Veg Manchurian', 'Crispy veg balls in tangy sauce', 199, 'Starters', true),
    dish(4, 'Paneer Butter Masala', 'Creamy tomato gravy with paneer', 289, 'Main Course', true),
    dish(5, 'Butter Chicken', 'Tandoori chicken in rich makhani gravy', 329, 'Main Course', false),
    dish(6, 'Dal Tadka', 'Yellow lentils tempered with ghee and garlic', 189, 'Main Course', true, false),
    dish(7, 'Hyderabadi Chicken Biryani', 'Dum biryani with raita and mirchi ka salan', 349, 'Biryani', false),
    dish(8, 'Veg Dum Biryani', 'Fragrant basmati with seasonal vegetables', 259, 'Biryani', true),
    dish(9, 'Butter Naan', 'Soft tandoor-baked bread with butter', 55, 'Breads', true),
    dish(10, 'Garlic Naan', 'Naan topped with garlic and coriander', 65, 'Breads', true),
    dish(11, 'Gulab Jamun (2 pcs)', 'Warm milk dumplings in sugar syrup', 89, 'Desserts', true),
    dish(12, 'Fresh Lime Soda', 'Sweet or salted', 69, 'Beverages', true),
  ];
  const byName = Object.fromEntries(menu.map((m) => [m.name, m]));

  let orderId = 0;
  const makeOrder = (customer, payment, picks, status, settled, msAgo) => {
    orderId += 1;
    const items = picks.map(([name, quantity]) => ({ name, quantity, price: byName[name].price }));
    const itemTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      id: orderId,
      orderNumber: `FD${10000 + orderId}`,
      sellerId: 1,
      customerName: customer,
      paymentMode: payment,
      items,
      itemTotal,
      packagingCharge: seller.packagingCharge,
      total: itemTotal + seller.packagingCharge,
      status,
      settled,
      createdAt: ago(msAgo),
      updatedAt: ago(msAgo),
    };
  };

  const orders = [
    // live queue
    makeOrder('Ananya Rao', 'UPI', [['Paneer Butter Masala', 1], ['Butter Naan', 2]], 'PENDING', false, 2 * MIN),
    makeOrder('Rohit Verma', 'COD', [['Hyderabadi Chicken Biryani', 1], ['Chicken 65', 1]], 'PENDING', false, 7 * MIN),
    makeOrder('Meera Nair', 'CARD', [['Veg Dum Biryani', 2]], 'ACCEPTED', false, 14 * MIN),
    makeOrder('Karthik Reddy', 'UPI', [['Butter Chicken', 1], ['Garlic Naan', 2]], 'PREPARING', false, 22 * MIN),
    makeOrder('Sneha Iyer', 'UPI', [['Paneer Tikka', 1], ['Fresh Lime Soda', 2]], 'READY_FOR_PICKUP', false, 31 * MIN),
    // delivered + settled
    makeOrder('Arjun Mehta', 'UPI', [['Hyderabadi Chicken Biryani', 1], ['Gulab Jamun (2 pcs)', 1]], 'DELIVERED', true, 3 * DAY),
    makeOrder('Divya Sharma', 'CARD', [['Paneer Butter Masala', 1], ['Butter Naan', 1]], 'DELIVERED', true, 5 * DAY),
    makeOrder('Imran Khan', 'UPI', [['Butter Chicken', 1], ['Garlic Naan', 1]], 'DELIVERED', true, 7 * DAY),
    makeOrder('Ananya Rao', 'CARD', [['Veg Dum Biryani', 1], ['Fresh Lime Soda', 1]], 'DELIVERED', true, 9 * DAY),
    makeOrder('Rohit Verma', 'UPI', [['Chicken 65', 1], ['Hyderabadi Chicken Biryani', 1]], 'DELIVERED', true, 11 * DAY),
    makeOrder('Meera Nair', 'CARD', [['Paneer Tikka', 1], ['Veg Manchurian', 1]], 'DELIVERED', true, 13 * DAY),
    // delivered, awaiting payout
    makeOrder('Divya Sharma', 'UPI', [['Butter Chicken', 1], ['Butter Naan', 2]], 'DELIVERED', false, 20 * HOUR),
    makeOrder('Imran Khan', 'COD', [['Hyderabadi Chicken Biryani', 2]], 'DELIVERED', false, 9 * HOUR),
    makeOrder('Ananya Rao', 'CARD', [['Paneer Tikka', 1], ['Veg Dum Biryani', 1]], 'DELIVERED', false, 4 * HOUR),
    // cancelled / rejected
    makeOrder('Rohit Verma', 'UPI', [['Dal Tadka', 1]], 'CANCELLED', false, DAY + 3 * HOUR),
    makeOrder('Meera Nair', 'COD', [['Veg Manchurian', 2]], 'REJECTED', false, 2 * DAY),
  ];

  const settledTotal = (from, to) =>
    orders.filter((o) => o.status === 'DELIVERED' && o.settled).slice(from, to).reduce((s, o) => s + o.total, 0);

  const payouts = [
    { id: 3, sellerId: 1, amount: settledTotal(4, 6), orderCount: 2, status: 'PROCESSED', reference: 'PO240102', paidAt: ago(7 * DAY) },
    { id: 2, sellerId: 1, amount: settledTotal(2, 4), orderCount: 2, status: 'PROCESSED', reference: 'PO240101', paidAt: ago(14 * DAY) },
    { id: 1, sellerId: 1, amount: settledTotal(0, 2), orderCount: 2, status: 'PROCESSED', reference: 'PO240100', paidAt: ago(21 * DAY) },
  ];

  return { seller, menu, orders, payouts, nextOrderId: orderId + 1, nextMenuId: menu.length + 1, nextPayoutId: 4 };
}

export const DEMO_CUSTOMERS = ['Ananya Rao', 'Rohit Verma', 'Meera Nair', 'Karthik Reddy', 'Sneha Iyer', 'Arjun Mehta'];
