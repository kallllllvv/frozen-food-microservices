const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Database sementara untuk menyimpan pesanan
let orders = []; 

// ==========================================
// DAFTAR ENDPOINT API ORDER SERVICE
// ==========================================

// 1. POST Membuat pesanan baru (Checkout)
app.post('/api/orders', (req, res) => {
    const { customerName, items, total } = req.body;
    
    const newOrder = {
        orderId: `FZN-${Date.now()}`,
        customerName: customerName || 'Pembeli Tamu', // Jika nama kosong, isi dengan Pembeli Tamu
        items,
        total,
        status: 'Belum Dibayar' // Status awal sebelum dibayar
    };
    
    orders.push(newOrder);
    res.status(201).json({ message: 'Pesanan berhasil dibuat, silakan lakukan pembayaran!', order: newOrder });
});

// 2. PUT Simulasi Pembayaran (Payment)
app.put('/api/orders/pay/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    const orderIndex = orders.findIndex(o => o.orderId === orderId);

    if (orderIndex === -1) {
        return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    // Ubah status pesanan karena sudah dibayar
    orders[orderIndex].status = 'Sudah Dibayar - Sedang Dikemas';
    res.json({ 
        message: 'Pembayaran Berhasil! Makanan sedang disiapkan.', 
        order: orders[orderIndex] 
    });
});

// 3. GET Riwayat Pesanan User (Last Order)
app.get('/api/orders/history/:customerName', (req, res) => {
    const name = req.params.customerName;
    // Cari semua pesanan yang nama pembelinya cocok
    const userOrders = orders.filter(o => o.customerName === name);
    
    res.json(userOrders);
});

// 4. DELETE Membatalkan Pesanan
app.delete('/api/orders/cancel/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    const orderIndex = orders.findIndex(o => o.orderId === orderId);

    if (orderIndex === -1) {
        return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    // Hapus pesanan dari array database sementara
    orders.splice(orderIndex, 1);
    res.json({ message: 'Pesanan berhasil dibatalkan.' });
});

// ==========================================
// JALANKAN SERVER
// ==========================================
app.listen(4002, () => {
    console.log('✅ Order Service berjalan di http://localhost:4002');
});