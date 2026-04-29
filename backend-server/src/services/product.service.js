const ProductModel = require('../models/product.model');

const fetchAllProducts = async (categoryQuery) => {
  // Wajib pakai await agar sistem menunggu data dari MySQL selesai diambil
  let data = await ProductModel.fetchProducts();
  
  // Jika ada query kategori dari frontend (misal: '?category=Ayam'), filter datanya
  if (categoryQuery) {
    data = data.filter(p => p.category.toLowerCase() === categoryQuery.toLowerCase());
  }
  
  return data;
};

const fetchProductById = async (id) => {
  // Wajib pakai await juga di sini
  return await ProductModel.fetchProductById(id);
};

module.exports = { 
  fetchAllProducts, 
  fetchProductById 
};