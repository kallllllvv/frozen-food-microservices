const ProductModel = require('../models/product.model');
const OrderModel = require('../models/order.model');
const BannerModel = require('../models/banner.model');

const getDashboardStats = async () => {
  return await OrderModel.getAdminStats();
};

const listProducts = async () => {
  return await ProductModel.fetchProducts();
};

const createProduct = async (payload) => {
  const name = String(payload.name || '').trim();
  const category = String(payload.category || '').trim();
  const price = Number(payload.price);
  const stock = Number(payload.stock);
  const image = String(payload.image || '').trim();
  const tag = String(payload.tag || '').trim();

  if (!name || !category || !Number.isFinite(price) || price <= 0) {
    throw new Error('Nama, kategori, dan harga produk wajib diisi dengan benar.');
  }

  const productId = await ProductModel.createProduct({
    name,
    category,
    price,
    stock: Number.isFinite(stock) && stock >= 0 ? stock : 0,
    image,
    tag,
  });

  return { id: productId };
};

const updateStock = async (productId, payload) => {
  const mode = String(payload.mode || 'set').trim();
  const value = Number(payload.value);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Nilai stok harus berupa angka valid.');
  }

  if (mode === 'add') {
    await ProductModel.addProductStock(productId, value);
  } else {
    await ProductModel.setProductStock(productId, value);
  }
};

const listOrders = async () => {
  return await OrderModel.fetchOrders();
};

const updateOrderStatus = async (orderId, payload) => {
  const status = String(payload.status || '').trim();
  const trackingNumber = payload.trackingNumber ? String(payload.trackingNumber).trim() : null;

  if (!status) {
    throw new Error('Status order wajib diisi.');
  }

  await OrderModel.updateOrderStatus(orderId, status, trackingNumber);
};

const listBanners = async () => {
  return await BannerModel.fetchBanners();
};

const createBanner = async (payload) => {
  const title = String(payload.title || '').trim();
  const image_url = String(payload.image_url || payload.imageUrl || '').trim();
  const link_url = String(payload.link_url || payload.linkUrl || '').trim();
  const is_active = Boolean(payload.is_active ?? payload.isActive ?? true);

  if (!title || !image_url) {
    throw new Error('Judul dan gambar banner wajib diisi.');
  }

  const bannerId = await BannerModel.insertBanner({
    title,
    image_url,
    link_url,
    is_active,
  });

  return { id: bannerId };
};

module.exports = {
  getDashboardStats,
  listProducts,
  createProduct,
  updateStock,
  listOrders,
  updateOrderStatus,
  listBanners,
  createBanner,
};