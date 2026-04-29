const express = require('express');
const cors = require('cors');

// Import Routes
const productRoutes = require('./routes/product.route');
const authRoutes = require('./routes/auth.route');
const orderRoutes = require('./routes/order.route');

// Import Database & Models
const { initDatabase } = require('./config/db');
const OrderModel = require('./models/order.model');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Wajib ada agar bisa membaca req.body (JSON) dari frontend

// Gunakan routing
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Inisialisasi Database -> Bikin Tabel -> Jalankan Server
initDatabase()
  .then(() => {
    console.log('✅ Inisialisasi database utama selesai (tabel users sudah dicek/dibuat).');
    
    // Setelah database utama konek, jalankan pembuatan tabel order
    return OrderModel.createTables();
  })
  .then(() => {
    console.log('✅ Tabel orders siap digunakan!');
    
    // Jalankan server HANYA JIKA semua koneksi database dan tabel berhasil disiapkan
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Gagal menyiapkan database atau server:', error.message);
    process.exit(1); // Matikan proses Node.js jika terjadi error fatal
  });