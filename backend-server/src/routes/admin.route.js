const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');

router.get('/stats', AdminController.getStats);
router.get('/products', AdminController.getProducts);
router.post('/products', AdminController.createProduct);
router.patch('/products/:id/stock', AdminController.updateStock);
router.get('/orders', AdminController.getOrders);
router.patch('/orders/:id/status', AdminController.updateOrderStatus);
router.get('/banners', AdminController.getBanners);
router.post('/banners', AdminController.createBanner);

module.exports = router;