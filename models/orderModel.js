const pool = require('../db');

exports.getCartItemsByUserId = (userId) =>
  pool.query(`SELECT * FROM cart_items WHERE user_id = $1`, [userId]);

exports.getVariantDetails = (variantId) =>
  pool.query(
    `SELECT product_id, size_options
     FROM product_variants WHERE id = $1`,
    [variantId]
  );

exports.getVariantPriceAndStockBySize = (variantId, size) => {
  return pool.query(
    `SELECT 
        (elem->>'price')::numeric AS price,
        (elem->>'stock')::int AS stock,
        pv.product_id
     FROM product_variants pv
     CROSS JOIN LATERAL jsonb_array_elements(pv.size_options) elem
     WHERE pv.id = $1
       AND LOWER(TRIM(elem->>'size')) = LOWER(TRIM($2))`,
    [variantId, size.trim()]
  );
};

exports.updateOrderTotal = (orderId, totalAmount) => {
  return pool.query(
    `UPDATE orders SET total_amount = $2 WHERE id = $1`,
    [orderId, totalAmount]
  );
};


exports.reduceStock = async (variantId, size, quantity) => {
  await pool.query(
    `UPDATE product_variants
     SET size_options = jsonb_set(
       size_options,
       ('{' || idx || ',stock}')::text[],
       ((size_options -> (idx::int) ->> 'stock')::int - $1)::text::jsonb
     )
     FROM (
       SELECT ord - 1 AS idx
       FROM product_variants,
            jsonb_array_elements(size_options) WITH ORDINALITY arr(elem, ord)
       WHERE id = $2
         AND elem @> jsonb_build_object('size', $3::text)
     ) sub
     WHERE id = $2;`,
    [quantity, variantId, size]
  );
};


exports.createOrder = (customerId, totalAmount, addressId, paymentMethod) =>
  pool.query(
    `INSERT INTO orders (customer_id, total_amount, status, payment_status, address_id, payment_method)
     VALUES ($1, $2, 'PENDING', 'PENDING', $3, $4)
     RETURNING *`,
    [customerId, totalAmount, addressId, paymentMethod]
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
