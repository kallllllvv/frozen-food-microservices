const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Data dummy produk frozen food
const frozenProducts = [
    { id: 1, name: 'Fiesta Chicken Nugget 500g', price: 45000, category: 'Ayam', stock: 20 },
    { id: 2, name: 'Kanzler Sosis Bakar', price: 55000, category: 'Sosis', stock: 15 },
    { id: 3, name: 'Belfoods Kentang Goreng 1kg', price: 32000, category: 'Kentang', stock: 50 },
    { id: 4, name: 'Cedea Dumpling Keju', price: 28000, category: 'Seafood', stock: 10 }
];

// Endpoint untuk mengambil semua produk
app.get('/api/products', (req, res) => {
    res.json(frozenProducts);
});

app.listen(4001, () => {
    console.log('✅ Product Service berjalan di http://localhost:4001');
});