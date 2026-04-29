const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');

// PENTING: /history/:email harus di atas /:id
router.post('/', OrderController.createOrder); // atau '/create' tergantung setup-mu
router.get('/history/:email', OrderController.getHistoryByEmail);
router.get('/:id', OrderController.getOrderDetail);
router.get('/', OrderController.getOrders); 

module.exports = router;