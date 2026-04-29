const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db'); // Sesuaikan pathnya

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const pool = getPool();

        // Cek apakah email sudah ada
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ message: "Email sudah terdaftar" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Masukkan user baru ke database
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'user']
        );

        res.status(201).json({ message: "Registrasi berhasil", userId: result.insertId, role: 'user' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const pool = getPool();

        // Cari user berdasarkan email
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];
        
        // Cek user ada dan password cocok
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign({ id: user.id }, 'secret_key_123', { expiresIn: '1d' });
            
            res.json({
                message: "Login berhasil",
                token,
                user: { name: user.name, email: user.email, role: user.role || 'user' }
            });
        } else {
            res.status(401).json({ message: "Email atau password salah" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
};