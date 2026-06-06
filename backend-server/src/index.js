const express = require('express');
const cors = require('cors');
const http = require('http');

// Import Routes
const productRoutes = require('./routes/product.route');
const authRoutes = require('./routes/auth.route');
const orderRoutes = require('./routes/order.route');
const adminRoutes = require('./routes/admin.route');
const bannerRoutes = require('./routes/banner.route');

// Import Database & Models
const { initDatabase } = require('./config/db');
const ProductModel = require('./models/product.model');
const OrderModel = require('./models/order.model');
const BannerModel = require('./models/banner.model');
const { initRealtime } = require('./realtime/socket');

const app = express();
const PORT = 5000;
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json()); // Wajib ada agar bisa membaca req.body (JSON) dari frontend

// Gunakan routing
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannerRoutes);

// Inisialisasi Database -> Bikin Tabel -> Jalankan Server
initDatabase()
  .then(() => {
    console.log('✅ Inisialisasi database utama selesai (tabel users sudah dicek/dibuat).');
    
    // Setelah database utama konek, jalankan pembuatan tabel products
    return ProductModel.createTables();
  })
  .then(() => {
    console.log('✅ Tabel products siap digunakan!');
    
    // Setelah tabel products siap, jalankan pembuatan tabel order
    return OrderModel.createTables();
  })
  .then(() => {
    console.log('✅ Tabel orders siap digunakan!');

    // Setelah tabel orders siap, jalankan pembuatan tabel banners
    return BannerModel.createTables();
  })
  .then(() => {
    console.log('✅ Tabel banners siap digunakan!');
    
    // Jalankan server HANYA JIKA semua koneksi database dan tabel berhasil disiapkan
    initRealtime(server);

    server.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Gagal menyiapkan database atau server:', error.message);
    process.exit(1); // Matikan proses Node.js jika terjadi error fatal
  });