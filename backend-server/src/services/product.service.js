const ProductModel = require('../models/product.model');

const fetchAllProducts = (categoryQuery) => {
  let data = ProductModel.getAllProducts();
  if (categoryQuery) {
    data = data.filter(p => p.category === categoryQuery);
  }
  return data;
};

const fetchProductById = (id) => {
  return ProductModel.getProductById(id);
};

module.exports = { fetchAllProducts, fetchProductById };