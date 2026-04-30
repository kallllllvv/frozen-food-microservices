const { getPool } = require('../config/db');

const createTables = async () => {
  const db = getPool();

  try {
    // 1. Cek apakah tabel products sudah ada dan punya kolom 'stock'
    let tableNeedsUpdate = false;
    let costPriceNeedsUpdate = false;
    let brandColumnNeedsUpdate = false;
    try {
      const [columns] = await db.execute("SHOW COLUMNS FROM products LIKE 'stock'");
      if (columns.length === 0) {
        tableNeedsUpdate = true; // Tabel ada tapi versi lama (belum ada 'stock')
      }

      const [costColumns] = await db.execute("SHOW COLUMNS FROM products LIKE 'cost_price'");
      if (costColumns.length === 0) {
        costPriceNeedsUpdate = true;
      }

      const [brandColumns] = await db.execute("SHOW COLUMNS FROM products LIKE 'brand'");
      if (brandColumns.length === 0) {
        brandColumnNeedsUpdate = true;
      }
    } catch (err) {
      tableNeedsUpdate = true; // Tabel sama sekali belum ada
    }

    // 2. Jika butuh diupdate, hapus tabel lama, buat baru, dan isi 16 data
    if (tableNeedsUpdate) {
      console.log('⚠️ Mereset tabel products ke versi terbaru...');
      await db.execute('DROP TABLE IF EXISTS products');
      
      await db.execute(`
        CREATE TABLE products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL,
          price INT NOT NULL,
          stock INT NOT NULL DEFAULT 0,
          cost_price INT NOT NULL DEFAULT 0,
          image TEXT,
          tag VARCHAR(50),
          brand VARCHAR(100)
        )
      `);
      console.log('✅ Tabel products baru berhasil dibuat!');

      const products = [
        // KATEGORI AYAM
        ['Nugget Ayam Crispy 500gr', 'Ayam', 45000, 25, 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop', 'Best Seller', 'Fiesta'],
        ['Spicy Chicken Wings 500gr', 'Ayam', 55000, 15, 'https://images.unsplash.com/photo-1626804475297-41607ea0af49?q=80&w=800&auto=format&fit=crop', 'Pedas', 'Indofood'],
        ['Dada Ayam Fillet 1kg', 'Ayam', 60000, 30, 'https://images.unsplash.com/photo-1604544525916-291129b0bd21?q=80&w=800&auto=format&fit=crop', 'Fresh', 'New Sigen'],
        ['Chicken Karage Jepang 500gr', 'Ayam', 50000, 10, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop', 'Diskon', 'Fiesta'],
        // KATEGORI DAGING
        ['Sosis Sapi Bakar Jumbo', 'Daging', 52000, 40, 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop', 'Best Seller', 'Indofood'],
        ['Bakso Sapi Asli Isi 50', 'Daging', 60000, 22, 'https://images.unsplash.com/photo-1529006557810-264b5ca99197?q=80&w=800&auto=format&fit=crop', '', 'Kepiting'],
        ['Daging Sapi Slice 500gr', 'Daging', 75000, 12, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop', 'Premium', 'New Sigen'],
        ['Daging Cincang Sapi 500gr', 'Daging', 65000, 18, 'https://images.unsplash.com/photo-1551028150-64b9e398f678?q=80&w=800&auto=format&fit=crop', '', 'Indofood'],
        // KATEGORI SEAFOOD
        ['Ikan Dory Fillet 1kg', 'Seafood', 55000, 20, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800&auto=format&fit=crop', 'Favorit', 'Sarimas'],
        ['Udang Kupas Beku 500gr', 'Seafood', 80000, 8, 'https://images.unsplash.com/photo-1559742811-822873691df8?q=80&w=800&auto=format&fit=crop', 'Baru', 'Sarimas'],
        ['Cumi Ring Frozen 500gr', 'Seafood', 65000, 14, 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?q=80&w=800&auto=format&fit=crop', '', 'Selera Laut'],
        ['Bakso Ikan Kuah Isi 30', 'Seafood', 35000, 35, 'https://images.unsplash.com/photo-1594968846395-81676f9d2d8c?q=80&w=800&auto=format&fit=crop', 'Diskon', 'Indofood'],
        // KATEGORI CAMILAN
        ['Kentang Goreng Shoestring 1kg', 'Camilan', 32000, 50, 'https://images.unsplash.com/photo-1630384066202-18d038253a1d?q=80&w=800&auto=format&fit=crop', 'Promo', 'Fiesta'],
        ['Dimsum Ayam Mix Isi 15', 'Camilan', 40000, 15, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=800&auto=format&fit=crop', 'Favorit', 'Indofood'],
        ['Donat Kentang Frozen Isi 10', 'Camilan', 25000, 25, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800&auto=format&fit=crop', 'Manis', 'Saji'],
        ['Cireng Rujak Crispy', 'Camilan', 20000, 45, 'https://images.unsplash.com/photo-1628191137573-dee64e727cb1?q=80&w=800&auto=format&fit=crop', '', 'Cimory']
      ];

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        for (const p of products) {
          const [name, category, price, stock, image, tag, brand] = p;
          const costPrice = Math.round(price * 0.7);
          await connection.execute(
            `INSERT INTO products (name, category, price, stock, cost_price, image, tag, brand) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
            [name, category, price, stock, costPrice, image, tag, brand]
          );
        }
        await connection.commit();
        console.log('✅ 16 Data produk baru dengan gambar HD dan brand berhasil disuntikkan!');
      } catch (error) {
        await connection.rollback();
        console.error('❌ Gagal memasukkan data produk:', error);
      } finally {
        connection.release();
      }
    }

    if (costPriceNeedsUpdate && !tableNeedsUpdate) {
      await db.execute('ALTER TABLE products ADD COLUMN cost_price INT NOT NULL DEFAULT 0 AFTER stock');
      await db.execute('UPDATE products SET cost_price = ROUND(price * 0.7) WHERE cost_price = 0 OR cost_price IS NULL');
      console.log('✅ Kolom cost_price produk berhasil ditambahkan!');
    }

    if (brandColumnNeedsUpdate && !tableNeedsUpdate) {
      await db.execute('ALTER TABLE products ADD COLUMN brand VARCHAR(100) AFTER tag');
      console.log('✅ Kolom brand produk berhasil ditambahkan!');
    }
  } catch (error) {
    console.error('❌ Error saat membuat/mengisi tabel products:', error);
  }
};

const fetchProducts = async () => {
  const db = getPool();
  const [rows] = await db.execute('SELECT * FROM products');
  return rows;
};

const fetchProductById = async (id) => {
  const db = getPool();
  const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);
  return rows[0];
};

const insertProduct = async (productData) => {
  const db = getPool();
  const { name, category, price, stock, image, tag, brand } = productData;

  const [result] = await db.execute(
    `INSERT INTO products (name, category, price, stock, image, tag, brand)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, category, price, stock, image || null, tag || null, brand || null]
  );

  return result.insertId;
};

const setProductStock = async (id, stock) => {
  const db = getPool();
  await db.execute('UPDATE products SET stock = ? WHERE id = ?', [stock, id]);
};

const addProductStock = async (id, amount) => {
  const db = getPool();
  await db.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [amount, id]);
};

const createProduct = async (productData) => {
  const db = getPool();
  const { name, category, price, stock, cost_price, image, tag, brand } = productData;

  const [result] = await db.execute(
    `INSERT INTO products (name, category, price, stock, cost_price, image, tag, brand)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, category, price, stock, cost_price || Math.round(Number(price) * 0.7), image || null, tag || null, brand || null]
  );

  return result.insertId;
};

module.exports = {
  createTables,
  fetchProducts,
  fetchProductById,
  insertProduct,
  setProductStock,
  addProductStock,
  createProduct,
};