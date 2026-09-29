// routes/productRoutes.js
// Defines the URL paths for products and points them to the controller.

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts); // GET /api/products
router.get('/:id', productController.getProductById); // GET /api/products/:id

module.exports = router;