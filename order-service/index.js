const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let orders = []; // Tempat menyimpan pesanan sementara

// Endpoint untuk membuat pesanan baru
app.post('/api/orders', (req, res) => {
    const { customerName, items, total } = req.body;
    const newOrder = {
        orderId: `FZN-${Date.now()}`,
        customerName,
        items,
        total,
        status: 'Sedang Dikemas'
    };
    orders.push(newOrder);
    res.status(201).json({ message: 'Pesanan berhasil dibuat!', order: newOrder });
});

app.listen(4002, () => {
    console.log('✅ Order Service berjalan di http://localhost:4002');
});