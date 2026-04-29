const { getPool } = require('../config/db');

const createTables = async () => {
  const db = getPool();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      image_url TEXT NOT NULL,
      link_url TEXT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

const fetchActiveBanners = async () => {
  const db = getPool();
  const [rows] = await db.execute(
    `SELECT id, title, image_url, link_url, is_active, created_at
     FROM banners
     WHERE is_active = 1
     ORDER BY created_at DESC`
  );
  return rows;
};

const fetchBanners = async () => {
  const db = getPool();
  const [rows] = await db.execute(
    `SELECT id, title, image_url, link_url, is_active, created_at
     FROM banners
     ORDER BY created_at DESC`
  );
  return rows;
};

const insertBanner = async (bannerData) => {
  const db = getPool();
  const { title, image_url, link_url, is_active } = bannerData;

  const [result] = await db.execute(
    `INSERT INTO banners (title, image_url, link_url, is_active)
     VALUES (?, ?, ?, ?)`,
    [title, image_url, link_url || null, is_active ? 1 : 0]
  );

  return result.insertId;
};

module.exports = {
  createTables,
  fetchActiveBanners,
  fetchBanners,
  insertBanner,
};