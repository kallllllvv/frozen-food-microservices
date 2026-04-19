const mysql = require('mysql2/promise');

const DB_NAME = 'frozen_shelly_db';

let pool = null;

const baseConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const initDatabase = async () => {
  const adminPool = mysql.createPool(baseConfig);

  try {
    await adminPool.execute(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);

    if (!pool) {
      pool = mysql.createPool({
        ...baseConfig,
        database: DB_NAME,
      });

      const connection = await pool.getConnection();
      connection.release();
      console.log('✅ Berhasil terhubung ke database MySQL!');
    }

    return pool;
  } finally {
    await adminPool.end();
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database belum diinisialisasi. Panggil initDatabase() terlebih dahulu.');
  }

  return pool;
};

module.exports = {
  initDatabase,
  getPool,
};