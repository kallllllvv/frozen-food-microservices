const jwt = require('jsonwebtoken');
const users = require('../models/user.model');

const SECRET_KEY = "rahasia_frozen_shelly_123"; // Kunci rahasia token

const register = (req, res) => {
  const { username, password } = req.body;
  
  // Cek apakah username sudah ada
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ success: false, message: "Username sudah terdaftar!" });
  }

  // Simpan user baru
  const newUser = { id: users.length + 1, username, password };
  users.push(newUser);

  res.status(201).json({ success: true, message: "Daftar berhasil! Silakan login." });
};

const login = (req, res) => {
  const { username, password } = req.body;

  // Cari user di "database"
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ success: false, message: "Username atau Password salah!" });
  }

  // Buat KTP Digital (Token)
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });

  res.status(200).json({ 
    success: true, 
    message: "Login berhasil!",
    token: token,
    user: { username: user.username }
  });
};

module.exports = { register, login };