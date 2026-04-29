const { getPool } = require('../config/db');

const createTables = async () => {
  const db = getPool();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      customer_name VARCHAR(100) NULL,
      customer_phone VARCHAR(30) NULL,
      shipping_address TEXT NULL,
      notes TEXT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'Diproses',
      total_amount INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      product_name VARCHAR(150) NOT NULL,
      unit_price INT NOT NULL,
      quantity INT NOT NULL,
      subtotal INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_order_items_order_id
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE
    )
  `);
};

const insertOrder = async (orderData) => {
  const db = getPool();
  const { user_email, payment_method, total_amount, items, customer_name, customer_phone, shipping_address, notes } = orderData;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_email, payment_method, total_amount, customer_name, customer_phone, shipping_address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)` ,
      [user_email, payment_method, total_amount, customer_name || null, customer_phone || null, shipping_address || null, notes || null]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)` ,
        [
          orderId,
          item.id,
          item.name,
          item.price,
          item.quantity,
          item.price * item.quantity
        ]
      );
    }

    await connection.commit();
    return orderId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const fetchOrdersByEmail = async (email) => {
  const db = getPool();
  const [orders] = await db.execute(
    `SELECT o.id, o.status, o.total_amount as total, DATE_FORMAT(o.created_at, '%d %M %Y') as date,
            GROUP_CONCAT(oi.product_name SEPARATOR ', ') as item_names
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.user_email = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [email]
  );
<<<<<<< HEAD
  return orders;
=======

  const [items] = await db.execute(
    `SELECT order_id, id, product_id, product_name, unit_price, quantity, subtotal
     FROM order_items
     ORDER BY id ASC`
  );

  const itemsByOrderId = items.reduce((acc, item) => {
    if (!acc[item.order_id]) {
      acc[item.order_id] = [];
    }

    acc[item.order_id].push(item);
    return acc;
  }, {});

  return orders.map((order) => ({
    ...order,
    items: itemsByOrderId[order.id] || [],
  }));
>>>>>>> db458ee360e835ecc2d996cae76eba89ec3950ef
};

// BAGIAN INI YANG DIUBAH AGAR MENGAMBIL DATA ALAMAT & CUSTOMER NAME
const fetchOrderById = async (orderId) => {
  const db = getPool();

  const [orders] = await db.execute(
    `SELECT id, user_email, payment_method, customer_name, customer_phone, shipping_address, notes, status, total_amount as total, DATE_FORMAT(created_at, '%d %M %Y') as date
     FROM orders
     WHERE id = ?`,
    [orderId]
  );

  if (!orders.length) return null;

  const [items] = await db.execute(
    `SELECT product_name as nama, unit_price as harga, quantity as qty, subtotal
     FROM order_items
     WHERE order_id = ?
     ORDER BY id ASC`,
    [orderId]
  );

  return { ...orders[0], items };
};

module.exports = {
  createTables,
  insertOrder,
  fetchOrdersByEmail,
  fetchOrderById,
};