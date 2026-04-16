// controllers/productController.js
const { frozenProducts } = require('../models/data'); // Panggil data dari model

const getAllProducts = (req, res) => {
    res.json(frozenProducts);
};

const getPromoProducts = (req, res) => {
    const promos = frozenProducts.filter(p => p.isPromo === true);
    res.json(promos);
};

const getProductById = (req, res) => {
    const product = frozenProducts.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ message: 'Barang tidak ditemukan' });
    res.json(product);
};

module.exports = { getAllProducts, getPromoProducts, getProductById };