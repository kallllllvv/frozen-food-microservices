const AdminService = require('../services/admin.service');
const { emitToAll, emitToAdmin, emitToUser } = require('../realtime/socket');

const getStats = async (req, res) => {
  try {
    const stats = await AdminService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await AdminService.listProducts();
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const result = await AdminService.createProduct(req.body);
    res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan.', data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateStock = async (req, res) => {
  try {
    const updatedProduct = await AdminService.updateStock(req.params.id, req.body);

    try {
      emitToAll('stock_updated', updatedProduct);
    } catch (realtimeError) {
      console.error('Realtime stock_updated gagal dikirim:', realtimeError.message);
    }

    res.status(200).json({ success: true, message: 'Stok berhasil diperbarui.', data: updatedProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await AdminService.listOrders();
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const updatedOrder = await AdminService.updateOrderStatus(req.params.id, req.body);
    const latestStats = await AdminService.getDashboardStats();

    try {
      emitToAdmin('order_status_updated', updatedOrder);
      emitToAdmin('dashboard_stats_updated', latestStats);
      emitToUser(updatedOrder?.user_email, 'order_status_updated', updatedOrder);
    } catch (realtimeError) {
      console.error('Realtime order_status_updated (admin) gagal dikirim:', realtimeError.message);
    }

    res.status(200).json({ success: true, message: 'Status order berhasil diperbarui.', data: updatedOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getBanners = async (req, res) => {
  try {
    const banners = await AdminService.listBanners();
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBanner = async (req, res) => {
  try {
    const result = await AdminService.createBanner(req.body);
    res.status(201).json({ success: true, message: 'Banner berhasil ditambahkan.', data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getProducts,
  createProduct,
  updateStock,
  getOrders,
  updateOrderStatus,
  getBanners,
  createBanner,
};