// controllers/orderController.js
// Handles order placement and viewing orders.

const db = require('../database/database');
const config = require('../config');

// Standard shipping is free once the order is over the threshold;
// express always costs the express price.
function shippingCost(subtotal, delivery) {
  if (delivery === 'express') return config.shippingExpress;
  if (subtotal >= config.freeShippingThreshold) return 0;
  return config.shippingStandard;
}

// POST /api/orders -> create an order from the current user's bag
exports.createOrder = (req, res) => {
  const userId = req.user.id;
  const customerName = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').trim();
  const address = String(req.body.address || '').trim();
  const delivery = req.body.delivery === 'express' ? 'express' : 'standard';
  const payment = req.body.payment === 'cod' ? 'cod' : 'card';

  // --- validate customer info ----------------------------------
  if (!customerName || !email || !phone || !address) {
    return res.status(400).json({ message: 'All fields (name, email, phone, address) are required.' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  // --- read the bag ---------------------------------------------
  const cartItems = db
    .prepare(
      `SELECT c.product_id AS productId,
              c.size,
              c.color,
              c.quantity,
              p.name,
              p.price,
              p.stock
       FROM cart c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ?`
    )
    .all(userId);

  // Empty bag -> nothing to order
  if (cartItems.length === 0) {
    return res.status(400).json({ message: 'Your bag is empty.' });
  }

  // --- stock check + totals (computed HERE on the server) ------
  // We never trust totals sent by the browser.
  let subtotal = 0;
  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({
        message: `Not enough stock for "${item.name}"${item.size ? ` (size ${item.size})` : ''}. Only ${item.stock} left.`
      });
    }
    subtotal += item.price * item.quantity;
  }

  const shipping = shippingCost(subtotal, delivery);
  const total = subtotal + shipping;

  // --- everything is checked: insert the order (as one transaction) -
  // A transaction means: either ALL steps succeed, or NONE of them do.
  const placeOrder = db.transaction(() => {
    // 1. Create the order with the totals we computed.
    const info = db
      .prepare(
        `INSERT INTO orders
           (user_id, subtotal, shipping, total, status, payment,
            customer_name, email, phone, address)
         VALUES (?, ?, ?, ?, 'placed', ?, ?, ?, ?, ?)`
      )
      .run(userId, subtotal, shipping, total, payment, customerName, email, phone, address);
    const orderId = info.lastInsertRowid;

    // 2. Save each ordered product + the size/colour chosen + price.
    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, size, color, quantity, price)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const reduceStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of cartItems) {
      insertItem.run(orderId, item.productId, item.size, item.color, item.quantity, item.price);
      reduceStock.run(item.quantity, item.productId); // 3. Reduce stock
    }

    // 4. Clear the user's bag (the order is now stored).
    db.prepare('DELETE FROM cart WHERE user_id = ?').run(userId);

    return orderId;
  });

  const orderId = placeOrder();

  const order = db
    .prepare('SELECT id, subtotal, shipping, total, status, payment, created_at FROM orders WHERE id = ?')
    .get(orderId);

  res.status(201).json({ message: 'Order placed successfully!', order });
}

// GET /api/orders -> the current user's orders, newest first
exports.getOrders = (req, res) => {
  const orders = db
    .prepare(
      `SELECT id, total, subtotal, shipping, status, payment, created_at
       FROM orders WHERE user_id = ? ORDER BY id DESC`
    )
    .all(req.user.id);

  const itemsFor = db.prepare(
    `SELECT oi.quantity, oi.price, oi.size, oi.color, p.name, p.image
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`
  );

  res.json({
    orders: orders.map((order) => ({
      ...order,
      items: itemsFor.all(order.id)
    }))
  });
};

// GET /api/orders/:id -> one order (with its items), only for its owner
exports.getOrderById = (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid order ID.' });
  }

  const order = db
    .prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(id, req.user.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  const items = db
    .prepare(
      `SELECT oi.quantity, oi.price, oi.size, oi.color, p.name, p.image
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`
    )
    .all(id);

  res.json({ order, items });
};
