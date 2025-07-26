const pool = require('../db');

exports.getCartItemsByUserId = (userId) =>
  pool.query(`SELECT * FROM cart_items WHERE user_id = $1`, [userId]);

exports.getVariantDetails = (variantId) =>
  pool.query(`SELECT product_id, price, stock FROM product_variants WHERE id = $1`, [variantId]);

exports.reduceStock = (quantity, variantId) =>
  pool.query(`UPDATE product_variants SET stock = stock - $1 WHERE id = $2`, [quantity, variantId]);

exports.createOrder = (customerId, totalAmount) =>
  pool.query(
    `INSERT INTO orders (customer_id, total_amount, status, payment_status)
     VALUES ($1, $2, 'PENDING', 'PENDING') RETURNING *`,
    [customerId, totalAmount]
  );

exports.addOrderItem = (orderId, productId, variantId, quantity, price) =>
  pool.query(
    `INSERT INTO order_items (order_id, product_id, variant_id, quantity, price)
     VALUES ($1, $2, $3, $4, $5)`,
    [orderId, productId, variantId, quantity, price]
  );

exports.clearCart = (userId) =>
  pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);

exports.getUserOrders = (userId) =>
  pool.query(
    `SELECT o.*, 
            (SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id) as items
     FROM orders o 
     WHERE customer_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  );

exports.getAllOrders = () =>
  pool.query(`
    SELECT 
      o.id,
      o.customer_id,
      u.name AS customer_name,
      o.status,
      o.payment_status,
      o.total_amount,
      o.created_at,
      o.updated_at,
      (
        SELECT json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'variant_id', oi.variant_id,
            'quantity', oi.quantity,
            'price', oi.price,
            'product_name', p.title
          )
        )
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = o.id
      ) AS items
    FROM orders o
    LEFT JOIN users u ON u.id = o.customer_id
    ORDER BY o.created_at DESC;
  `);

exports.updateOrderStatus = (status, paymentStatus, orderId) =>
  pool.query(
    `UPDATE orders 
     SET status = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $3 RETURNING *`,
    [status, paymentStatus, orderId]
  );
