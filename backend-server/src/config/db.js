const mysql = require('mysql2/promise');

const DB_NAME = 'frozen_shelly_db';

let pool = null;

const baseConfig = {
  host: 'localhost',
  user: 'root', // Sesuaikan jika kamu pakai user lain
  password: '', // Sesuaikan jika MySQL kamu ada passwordnya
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const initDatabase = async () => {
  // Bikin pool sementara tanpa milih database dulu (buat jaga-jaga kalau DB belum ada)
  const adminPool = mysql.createPool(baseConfig);

  try {
    // 1. Buat database jika belum ada
    await adminPool.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);

    if (!pool) {
      // 2. Buat pool utama yang langsung terhubung ke database
      pool = mysql.createPool({
        ...baseConfig,
        database: DB_NAME,
      });

      const connection = await pool.getConnection();
      console.log('✅ Berhasil terhubung ke database MySQL!');

      // 3. Buat tabel 'users' otomatis jika belum ada
      const createUsersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;
      
      await connection.execute(createUsersTableQuery);

      // Tambahkan kolom role jika tabel users sudah terlanjur ada dari versi lama
      const [roleColumns] = await connection.execute("SHOW COLUMNS FROM users LIKE 'role'");
      if (roleColumns.length === 0) {
        await connection.execute("ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user' AFTER password");
      }

      // Seed akun admin default kalau belum ada
      const adminEmail = 'admin@frozenshelly.com';
      const [existingAdmin] = await connection.execute('SELECT id FROM users WHERE email = ?', [adminEmail]);
      if (existingAdmin.length === 0) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('Admin123!', 10);
        await connection.execute(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          ['Admin FrozenShelly', adminEmail, hashedPassword, 'admin']
        );
        console.log('✅ Akun admin default berhasil dibuat!');
      }

      // Seed akun user default kalau belum ada
      const userEmail = 'user@frozenshelly.com';
      const [existingUser] = await connection.execute('SELECT id FROM users WHERE email = ?', [userEmail]);
      if (existingUser.length === 0) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('User123!', 10);
        await connection.execute(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          ['User FrozenShelly', userEmail, hashedPassword, 'user']
        );
        console.log('✅ Akun user default berhasil dibuat!');
      }
      console.log('✅ Tabel users siap digunakan!');

      connection.release();
    }

    return pool;
  } catch (error) {
    console.error('❌ Gagal inisialisasi database:', error.message);
    throw error; // Lempar error agar server tahu kalau gagal connect
  } finally {
    // Tutup koneksi admin karena sudah tidak diperlukan
    await adminPool.end();
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database belum diinisialisasi. Panggil initDatabase() terlebih dahulu di index.js.');
  }

  return pool;
};

module.exports = {
  initDatabase,
  getPool,
};