const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/product.route');

const app = express();
const PORT = 5000; // Pastikan port ini beda dengan frontend (biasanya 3000)

app.use(cors());
app.use(express.json());

// Gunakan routing
app.use('/api/products', productRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});