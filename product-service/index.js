const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 1. Data dummy produk frozen food (Sudah ditambah promo)
const frozenProducts = [
    { id: 1, name: 'Fiesta Chicken Nugget 500g', price: 45000, category: 'Ayam', stock: 20, isPromo: false },
    { id: 2, name: 'Kanzler Sosis Bakar', price: 55000, category: 'Sosis', stock: 15, isPromo: true, promoPrice: 49000 },
    { id: 3, name: 'Belfoods Kentang Goreng 1kg', price: 32000, category: 'Kentang', stock: 50, isPromo: false },
    { id: 4, name: 'Cedea Dumpling Keju', price: 28000, category: 'Seafood', stock: 10, isPromo: true, promoPrice: 25000 }
];

// ==========================================
// DAFTAR ENDPOINT API
// ==========================================

// 2. GET Semua Produk (Tampil di Home)
app.get('/api/products', (req, res) => {
    res.json(frozenProducts);
});

// 3. GET Promo Khusus (Harus ditaruh SEBELUM /:id)
app.get('/api/products/special/promo', (req, res) => {
    const promoItems = frozenProducts.filter(p => p.isPromo === true);
    res.json(promoItems);
});

// 4. GET Suggestion berdasarkan kategori (Harus ditaruh SEBELUM /:id)
app.get('/api/products/suggestion/:category', (req, res) => {
    const category = req.params.category;
    const suggestions = frozenProducts.filter(
        p => p.category.toLowerCase() === category.toLowerCase()
    );
    res.json(suggestions);
});

// 5. GET Detail Barang by ID (Ini yang dinamis, taruh paling bawah)
app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = frozenProducts.find(p => p.id === productId);
    
    if (!product) {
        return res.status(404).json({ message: 'Barang tidak ditemukan' });
    }
    res.json(product);
});

// ==========================================
// JALANKAN SERVER
// ==========================================
app.listen(4001, () => {
    console.log('✅ Product Service berjalan di http://localhost:4001');
});