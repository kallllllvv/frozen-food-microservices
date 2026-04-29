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
      tracking_number VARCHAR(100) NULL,
      total_amount INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [trackingColumns] = await db.execute("SHOW COLUMNS FROM orders LIKE 'tracking_number'");
  if (trackingColumns.length === 0) {
    await db.execute("ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100) NULL AFTER status");
  }

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

const fetchOrders = async () => {
  const db = getPool();
  const [rows] = await db.execute(
    `SELECT id, user_email, payment_method, customer_name, customer_phone, shipping_address, notes, status, tracking_number, total_amount as total, DATE_FORMAT(created_at, '%d %M %Y') as date
     FROM orders
     ORDER BY created_at DESC`
  );
  return rows;
};

const fetchOrdersByEmail = async (email) => {
  const db = getPool();
  
  // 1. Ambil data order
  const [orders] = await db.execute(
    `SELECT o.id, o.status, o.tracking_number, o.total_amount as total, DATE_FORMAT(o.created_at, '%d %M %Y') as date
     FROM orders o
     WHERE o.user_email = ?
     ORDER BY o.created_at DESC`,
    [email]
  );

  // 2. Ambil semua item untuk order-order tersebut
  const [items] = await db.execute(
    `SELECT order_id, product_name, quantity
     FROM order_items
     ORDER BY id ASC`
  );

  // 3. Gabungkan item ke dalam masing-masing order
  const itemsByOrderId = items.reduce((acc, item) => {
    if (!acc[item.order_id]) {
      acc[item.order_id] = [];
    }
    acc[item.order_id].push(`${item.product_name} x${item.quantity}`);
    return acc;
  }, {});

  return orders.map((order) => ({
    ...order,
    items: itemsByOrderId[order.id] || [],
  }));
};

const fetchOrderById = async (orderId) => {
  const db = getPool();

  const [orders] = await db.execute(
    `SELECT id, user_email, payment_method, customer_name, customer_phone, shipping_address, notes, status, tracking_number, total_amount as total, DATE_FORMAT(created_at, '%d %M %Y') as date
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

const updateOrderStatus = async (orderId, status, trackingNumber = null) => {
  const db = getPool();
  await db.execute('UPDATE orders SET status = ?, tracking_number = ? WHERE id = ?', [status, trackingNumber, orderId]);
  // Return updated order
  return await exports.fetchOrderById(orderId);
};

const getAdminStats = async () => {
  const db = getPool();

  const [[summary]] = await db.execute(`
    SELECT
      COUNT(*) AS total_orders,
      COALESCE(SUM(total_amount), 0) AS revenue,
      COUNT(DISTINCT user_email) AS total_buyers,
      SUM(CASE WHEN status = 'Diproses' THEN 1 ELSE 0 END) AS need_process,
      SUM(CASE WHEN status = 'Dikirim' THEN 1 ELSE 0 END) AS shipping,
      SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) AS completed
    FROM orders
  `);

  const [[profitRow]] = await db.execute(`
    SELECT COALESCE(SUM((oi.unit_price - COALESCE(p.cost_price, ROUND(p.price * 0.7))) * oi.quantity), 0) AS gross_profit
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
  `);

  const [monthlyRevenueRows] = await db.execute(`
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month_key,
           DATE_FORMAT(created_at, '%b %Y') AS month_label,
           COALESCE(SUM(total_amount), 0) AS revenue
    FROM orders
    GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
    ORDER BY month_key ASC
    LIMIT 6
  `);

  const [monthlyProfitRows] = await db.execute(`
    SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS month_key,
           COALESCE(SUM((oi.unit_price - COALESCE(p.cost_price, ROUND(p.price * 0.7))) * oi.quantity), 0) AS gross_profit
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
    ORDER BY month_key ASC
    LIMIT 6
  `);

  const profitMap = monthlyProfitRows.reduce((acc, row) => {
    acc[row.month_key] = Number(row.gross_profit || 0);
    return acc;
  }, {});

  const grossProfit = Number(profitRow.gross_profit || 0);
  const netProfit = Math.round(grossProfit * 0.88);

  return {
    totalOrders: Number(summary.total_orders || 0),
    revenue: Number(summary.revenue || 0),
    totalBuyers: Number(summary.total_buyers || 0),
    needProcess: Number(summary.need_process || 0),
    shipping: Number(summary.shipping || 0),
    completed: Number(summary.completed || 0),
    grossProfit,
    netProfit,
    monthlyFinance: monthlyRevenueRows.map((row) => ({
      month: row.month_label,
      revenue: Number(row.revenue || 0),
      grossProfit: Number(profitMap[row.month_key] || 0),
      netProfit: Math.round(Number(profitMap[row.month_key] || 0) * 0.88),
    })),
  };
};

module.exports = {
  createTables,
  insertOrder,
  fetchOrders,
  fetchOrdersByEmail,
  fetchOrderById,
  updateOrderStatus,
  getAdminStats,
};