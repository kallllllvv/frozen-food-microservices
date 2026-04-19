const { getPool } = require('../config/db');

const createTables = async () => {
  const db = getPool();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(100) NOT NULL,
      customer_phone VARCHAR(30) NOT NULL,
      shipping_address TEXT NOT NULL,
      notes TEXT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
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

  const {
    customerName,
    customerPhone,
    shippingAddress,
    notes,
    totalAmount,
    items,
  } = orderData;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (customer_name, customer_phone, shipping_address, notes, total_amount)
       VALUES (?, ?, ?, ?, ?)` ,
      [customerName, customerPhone, shippingAddress, notes || null, totalAmount]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)` ,
        [
          orderId,
          item.productId,
          item.productName,
          item.unitPrice,
          item.quantity,
          item.subtotal,
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

const fetchOrders = async () => {
  const db = getPool();

  const [orders] = await db.execute(
    `SELECT id, customer_name, customer_phone, shipping_address, notes, status, total_amount, created_at, updated_at
     FROM orders
     ORDER BY created_at DESC`
  );

  return orders;
};

const fetchOrderById = async (orderId) => {
  const db = getPool();

  const [orders] = await db.execute(
    `SELECT id, customer_name, customer_phone, shipping_address, notes, status, total_amount, created_at, updated_at
     FROM orders
     WHERE id = ?`,
    [orderId]
  );

  if (!orders.length) {
    return null;
  }

  const [items] = await db.execute(
    `SELECT id, product_id, product_name, unit_price, quantity, subtotal
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
  fetchOrders,
  fetchOrderById,
};