// routes/cartRoutes.js
// URL paths for the shopping bag.
// All of these require a logged-in user (requireAuth).
// Lines are addressed by cart line id (:lineId) because the same garment
// can sit in the bag in several sizes.

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const requireAuth = require('../middleware/authMiddleware');

router.use(requireAuth); // block everything below if not logged in

router.get('/', cartController.getCart); // GET /api/cart?delivery=express
router.post('/', cartController.addToCart); // POST /api/cart
router.delete('/', cartController.clearCart); // DELETE /api/cart
router.put('/:lineId', cartController.updateCartItem); // PUT /api/cart/:lineId
router.delete('/:lineId', cartController.removeCartItem); // DELETE /api/cart/:lineId

module.exports = router;
