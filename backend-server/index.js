// index.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Impor semua rute
const productRoutes = require('./routes/productRoutes');
// const orderRoutes = require('./routes/orderRoutes'); // Buka komentar jika file sudah dibuat
// const userRoutes = require('./routes/userRoutes');   // Buka komentar jika file sudah dibuat

// Daftarkan rute ke Express
app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/users', userRoutes);

// Jalankan server
app.listen(4000, () => {
    console.log('✅ Backend Server (MVC) berjalan di http://localhost:4000');
});