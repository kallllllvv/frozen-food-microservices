// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Ingat: kata '/api/products' nanti akan diatur di index.js
router.get('/', productController.getAllProducts);
router.get('/special/promo', productController.getPromoProducts);
router.get('/:id', productController.getProductById);

module.exports = router;