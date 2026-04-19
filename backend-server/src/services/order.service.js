const ProductService = require('./product.service');
const OrderModel = require('../models/order.model');

const normalizeOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Items pesanan wajib diisi.');
  }

  return items.map((item) => {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error('productId tidak valid.');
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('quantity harus lebih dari 0.');
    }

    const product = ProductService.fetchProductById(productId);

    if (!product) {
      throw new Error(`Produk dengan id ${productId} tidak ditemukan.`);
    }

    const subtotal = product.price * quantity;

    return {
      productId,
      productName: product.name,
      unitPrice: product.price,
      quantity,
      subtotal,
    };
  });
};

const createOrder = async (payload) => {
  const customerName = String(payload.customerName || '').trim();
  const customerPhone = String(payload.customerPhone || '').trim();
  const shippingAddress = String(payload.shippingAddress || '').trim();
  const notes = payload.notes ? String(payload.notes).trim() : '';

  if (!customerName) {
    throw new Error('customerName wajib diisi.');
  }

  if (!customerPhone) {
    throw new Error('customerPhone wajib diisi.');
  }

  if (!shippingAddress) {
    throw new Error('shippingAddress wajib diisi.');
  }

  const items = normalizeOrderItems(payload.items);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  const orderId = await OrderModel.insertOrder({
    customerName,
    customerPhone,
    shippingAddress,
    notes,
    totalAmount,
    items,
  });

  return {
    id: orderId,
    customerName,
    customerPhone,
    shippingAddress,
    notes: notes || null,
    totalAmount,
    status: 'pending',
    items,
  };
};

const listOrders = async () => {
  return OrderModel.fetchOrders();
};

const getOrderDetail = async (orderId) => {
  return OrderModel.fetchOrderById(orderId);
};

module.exports = {
  createOrder,
  listOrders,
  getOrderDetail,
};