const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/product.route');
const authRoutes = require('./routes/auth.route'); // BARU
const orderRoutes = require('./routes/order.route');
const { initDatabase } = require('./config/db');
const OrderModel = require('./models/order.model');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Gunakan routing
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes); // BARU
app.use('/api/orders', orderRoutes);

initDatabase()
  .then(() => OrderModel.createTables())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Gagal menyiapkan tabel order:', error.message);
    process.exit(1);
  });