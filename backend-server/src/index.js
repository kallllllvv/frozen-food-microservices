const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/product.route');
const authRoutes = require('./routes/auth.route'); // BARU

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Gunakan routing
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes); // BARU

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});