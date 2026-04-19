const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');

router.get('/', OrderController.getOrders);
router.get('/:id', OrderController.getOrderDetail);
router.post('/', OrderController.createOrder);

module.exports = router;