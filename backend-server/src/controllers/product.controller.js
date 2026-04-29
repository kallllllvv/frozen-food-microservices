const ProductService = require('../services/product.service');

const getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    // Tambahkan await di sini
    const products = await ProductService.fetchAllProducts(category);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductDetail = async (req, res) => {
  try {
    // Tambahkan await di sini
    const product = await ProductService.fetchProductById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProducts, getProductDetail };