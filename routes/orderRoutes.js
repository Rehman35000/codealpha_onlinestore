// routes/orderRoutes.js
// URL paths for orders. All require a logged-in user.

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const requireAuth = require('../middleware/authMiddleware');

router.use(requireAuth);

router.post('/', orderController.createOrder); // POST /api/orders
router.get('/', orderController.getOrders); // GET /api/orders
router.get('/:id', orderController.getOrderById); // GET /api/orders/:id

module.exports = router;