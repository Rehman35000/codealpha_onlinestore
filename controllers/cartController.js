// controllers/cartController.js
// Handles the shopping bag. Every bag belongs to one user (req.user.id),
// so these routes are all protected by requireAuth.
//
// A garment is identified by product + size + colour, so each bag line
// is one variant: picking a different size adds a new line instead of
// quietly changing the one you already had.

const db = require('../database/database');
const config = require('../config');

// Reads the bag of one user, joined with product info.
function getCartRows(userId) {
  return db
    .prepare(
      `SELECT c.id              AS lineId,
              c.product_id      AS productId,
              c.size,
              c.color,
              c.quantity,
              p.name,
              p.price,
              p.original_price AS originalPrice,
              p.image,
              p.stock
       FROM cart c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ?
       ORDER BY c.id`
    )
    .all(userId);
}

// Standard shipping is free once the bag is over the threshold.
function shippingCost(subtotal, delivery = 'standard') {
  if (delivery === 'express') return config.shippingExpress;
  if (subtotal >= config.freeShippingThreshold) return 0;
  return config.shippingStandard;
}

function sendCart(res, userId, delivery = 'standard') {
  const items = getCartRows(userId).map((item) => ({
    ...item,
    lineTotal: item.price * item.quantity // subtotal for this line
  }));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = shippingCost(subtotal, delivery);

  res.json({
    items,
    count,
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeShippingThreshold: config.freeShippingThreshold,
    amountToFreeShipping: Math.max(0, config.freeShippingThreshold - subtotal)
  });
}

// Makes sure the requested size/colour actually exist for this product.
function validateVariant(product, size, color) {
  if (product.sizes.length > 0 && !product.sizes.includes(size)) {
    return `Please choose a size: ${product.sizes.join(', ')}.`;
  }
  if (product.colors.length > 0 && !product.colors.some((c) => c.name === color)) {
    return `Please choose a colour: ${product.colors.map((c) => c.name).join(', ')}.`;
  }
  return null;
}

// GET /api/cart?delivery=standard|express
exports.getCart = (req, res) => {
  sendCart(res, req.user.id, req.query.delivery);
};

// POST /api/cart -> { productId, size, color, quantity? }
exports.addToCart = (req, res) => {
  const productId = Number(req.body.productId);
  const quantity = Number(req.body.quantity) || 1;
  const size = String(req.body.size || '').trim();
  const color = String(req.body.color || '').trim();

  // --- validate input ------------------------------------------
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: 'Invalid product ID.' });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: 'Quantity must be a positive whole number.' });
  }

  const product = db.prepare('SELECT id, sizes, colors, stock FROM products WHERE id = ?').get(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  const sizes = JSON.parse(product.sizes || '[]');
  const colors = JSON.parse(product.colors || '[]').map((c) => c.name);

  const variantError = validateVariant({ sizes, colors }, size, color);
  if (variantError) {
    return res.status(400).json({ message: variantError });
  }

  if (product.stock <= 0) {
    return res.status(400).json({ message: 'This piece is sold out.' });
  }

  // --- update or insert the bag line ---------------------------
  const row = db
    .prepare('SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?')
    .get(req.user.id, productId, size, color);

  const newQuantity = (row ? row.quantity : 0) + quantity;

  // Never let the customer add more than the available stock.
  if (newQuantity > product.stock) {
    return res.status(400).json({
      message: `Only ${product.stock} left in this size.`
    });
  }

  if (row) {
    db.prepare('UPDATE cart SET quantity = ? WHERE id = ?').run(newQuantity, row.id);
  } else {
    db.prepare('INSERT INTO cart (user_id, product_id, size, color, quantity) VALUES (?, ?, ?, ?, ?)').run(
      req.user.id,
      productId,
      size,
      color,
      quantity
    );
  }

  res.status(201).json({ message: 'Added to bag.' });
};

// PUT /api/cart/:lineId -> { quantity }  (set a specific quantity)
exports.updateCartItem = (req, res) => {
  const lineId = Number(req.params.lineId);
  const quantity = Number(req.body.quantity);

  if (!Number.isInteger(lineId) || lineId <= 0) {
    return res.status(400).json({ message: 'Invalid bag item.' });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: 'Quantity must be a positive whole number.' });
  }

  const line = db
    .prepare('SELECT product_id, stock FROM cart WHERE id = ? AND user_id = ?')
    .get(lineId, req.user.id);

  if (!line) {
    return res.status(404).json({ message: 'This piece is not in your bag.' });
  }
  if (quantity > line.stock) {
    return res.status(400).json({ message: `Only ${line.stock} left in this size.` });
  }

  db.prepare('UPDATE cart SET quantity = ? WHERE id = ?').run(quantity, lineId);

  res.json({ message: 'Bag updated.' });
};

// DELETE /api/cart/:lineId -> remove one line from the bag
exports.removeCartItem = (req, res) => {
  const lineId = Number(req.params.lineId);

  if (!Number.isInteger(lineId) || lineId <= 0) {
    return res.status(400).json({ message: 'Invalid bag item.' });
  }

  const info = db.prepare('DELETE FROM cart WHERE id = ? AND user_id = ?').run(lineId, req.user.id);

  if (info.changes === 0) {
    return res.status(404).json({ message: 'This piece is not in your bag.' });
  }

  res.json({ message: 'Removed from bag.' });
};

// DELETE /api/cart -> empty the whole bag
exports.clearCart = (req, res) => {
  db.prepare('DELETE FROM cart WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Bag emptied.' });
};
