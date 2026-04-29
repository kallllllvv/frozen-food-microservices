const OrderService = require('../services/order.service');

// 1. Membuat pesanan baru (Checkout)
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

// 2. Mengambil semua pesanan (Biasanya untuk halaman Admin)
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

// 3. Mengambil detail pesanan berdasarkan ID (Untuk Nota)
const getOrderDetail = async (req, res) => {
  try {
    const order = await OrderService.getOrderDetail(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order tidak ditemukan.',
      });
    }

    // Langsung mereturn objek order agar sesuai dengan state nota frontend
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Mengambil riwayat pesanan berdasarkan email (Untuk History User)
const getHistoryByEmail = async (req, res) => {
  try {
    // Memanggil listOrdersByEmail dari order.service.js
    const orders = await OrderService.listOrdersByEmail(req.params.email);
    // Langsung return array untuk mapping di frontend
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Konfirmasi pesanan diterima (User menerima barang)
const confirmOrderReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID order diperlukan.',
      });
    }

    const updatedOrder = await OrderService.updateOrderStatus(id, status || 'Selesai');
    res.status(200).json(updatedOrder);
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
  getHistoryByEmail,
  confirmOrderReceived
};