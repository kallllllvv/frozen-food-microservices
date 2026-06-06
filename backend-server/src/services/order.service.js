const ProductService = require('./product.service');
const OrderModel = require('../models/order.model');

// Fungsi untuk memastikan item valid dan harganya ditarik dari database asli
const normalizeOrderItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Items pesanan wajib diisi.');
  }

  const normalizedItems = [];

  for (const item of items) {
    // Frontend mengirimkan ID produk dengan key 'id'
    const productId = Number(item.id || item.productId);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error(`ID Produk ${productId} tidak valid.`);
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Quantity harus lebih dari 0.');
    }

    // Ambil data produk asli dari DB (Pastikan ProductService kamu support await/Promise)
    const product = await ProductService.fetchProductById(productId);

    if (!product) {
      throw new Error(`Produk dengan id ${productId} tidak ditemukan.`);
    }

    const subtotal = product.price * quantity;

    normalizedItems.push({
      id: productId, // Dikembalikan ke 'id' agar sesuai dengan OrderModel insert
      name: product.name,
      price: product.price,
      quantity,
      subtotal,
    });
  }

  return normalizedItems;
};

const createOrder = async (payload) => {
  // Ambil data dari payload Frontend
  const user_email = String(payload.email || '').trim();
  const payment_method = String(payload.method || '').trim();
  
  // Karena form UI frontend saat ini belum ada input alamat, kita buat opsional dulu
  const customer_name = payload.customerName ? String(payload.customerName).trim() : '';
  const customer_phone = payload.customerPhone ? String(payload.customerPhone).trim() : '';
  const shipping_address = payload.shippingAddress ? String(payload.shippingAddress).trim() : '';
  const notes = payload.notes ? String(payload.notes).trim() : '';

  if (!user_email) {
    throw new Error('Email pengguna wajib diisi.');
  }

  if (!payment_method) {
    throw new Error('Metode pembayaran wajib diisi.');
  }

  // Hitung ulang harga secara aman (Secure Server-Side Calculation)
  const items = await normalizeOrderItems(payload.items);
  const total_amount = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Lempar ke Model untuk disimpan ke Database MySQL
  const orderId = await OrderModel.insertOrder({
    user_email,
    payment_method,
    customer_name,
    customer_phone,
    shipping_address,
    notes,
    total_amount,
    items,
  });

  return {
    id: orderId,
    user_email,
    payment_method,
    customer_name,
    customer_phone,
    shipping_address,
    notes: notes || null,
    total_amount,
    status: 'Diproses',
    items,
  };
};

// Digunakan jika kamu punya halaman Admin untuk melihat SEMUA order
const listOrders = async () => {
  return await OrderModel.fetchOrders();
};

// Digunakan untuk halaman History user di frontend
const listOrdersByEmail = async (email) => {
  const rawOrders = await OrderModel.fetchOrdersByEmail(email);

  return rawOrders.map((order) => ({
    ...order,
    items: Array.isArray(order.items) ? order.items : [],
  }));
};

const getOrderDetail = async (orderId) => {
  return await OrderModel.fetchOrderById(orderId);
};

const updateOrderStatus = async (orderId, newStatus) => {
  return await OrderModel.updateOrderStatus(orderId, newStatus);
};

module.exports = {
  createOrder,
  listOrders,
  listOrdersByEmail,
  getOrderDetail,
  updateOrderStatus,
};