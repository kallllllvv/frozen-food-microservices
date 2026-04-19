const OrderService = require('../services/order.service');

const createOrder = async (req, res) => {
  try {
    const order = await OrderService.createOrder(req.body);
    res.status(201).json({
      success: true,
      message: 'Order berhasil dibuat.',
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await OrderService.listOrders();
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const order = await OrderService.getOrderDetail(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order tidak ditemukan.',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderDetail,
};