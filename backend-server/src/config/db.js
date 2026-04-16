const mysql = require('mysql2/promise');

// Membuat koneksi ke database XAMPP
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',      // Default user XAMPP adalah 'root'
  password: '',      // Default password XAMPP adalah kosong
  database: 'frozen_shelly_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Tes koneksi
pool.getConnection()
  .then((connection) => {
    console.log('✅ Berhasil terhubung ke database MySQL!');
    connection.release();
  })
  .catch((err) => {
    console.error('❌ Gagal terhubung ke database:', err.message);
  });

module.exports = pool;