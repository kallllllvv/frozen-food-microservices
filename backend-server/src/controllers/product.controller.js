const ProductService = require('../services/product.service');

const getProducts = (req, res) => {
  try {
    const { category } = req.query;
    const products = ProductService.fetchAllProducts(category);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductDetail = (req, res) => {
  try {
    const product = ProductService.fetchProductById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProducts, getProductDetail };