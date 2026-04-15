const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Database sementara untuk menyimpan data akun (berjalan di memori)
let users = [];

// ==========================================
// 1. ENDPOINT DAFTAR AKUN (REGISTER)
// ==========================================
app.post('/api/users/register', (req, res) => {
    const { name, email, password } = req.body;

    // Cek apakah email sudah terdaftar
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'Email sudah digunakan!' });
    }

    // Buat user baru
    const newUser = { id: Date.now(), name, email, password };
    users.push(newUser);
    
    res.status(201).json({ message: 'Pendaftaran berhasil! Silakan Login.', user: newUser });
});

// ==========================================
// 2. ENDPOINT LOGIN
// ==========================================
app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body;

    // Cari user berdasarkan email dan password
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Email atau Password salah!' });
    }

    res.json({ message: 'Login berhasil!', user: { id: user.id, name: user.name, email: user.email } });
});

// ==========================================
app.listen(4003, () => {
    console.log('✅ User Service berjalan di http://localhost:4003');
});