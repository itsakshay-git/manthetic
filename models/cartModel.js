const pool = require('../db');

exports.getCartItemsByUserId = async (userId) => {
  const result = await pool.query(`
    SELECT ci.id, ci.quantity, 
           pv.size, pv.price, pv.images, pv.stock,
           p.title AS product_title
    FROM cart_items ci
    JOIN product_variants pv ON ci.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    WHERE ci.user_id = $1
  `, [userId]);

  return result.rows;
};

exports.getExistingCartItem = async (userId, variantId) => {
  const result = await pool.query(
    'SELECT * FROM cart_items WHERE user_id = $1 AND variant_id = $2',
    [userId, variantId]
  );
  return result.rows[0];
};

exports.insertCartItem = async (userId, variantId, quantity) => {
  const result = await pool.query(
    'INSERT INTO cart_items (user_id, variant_id, quantity) VALUES ($1, $2, $3) RETURNING *',
    [userId, variantId, quantity]
  );
  return result.rows[0];
};

exports.updateCartItemQuantity = async (itemId, quantity, userId) => {
  const result = await pool.query(
    'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [quantity, itemId, userId]
  );
  return result.rows[0];
};

exports.incrementCartItemQuantity = async (itemId, quantity) => {
  const result = await pool.query(
    'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2 RETURNING *',
    [quantity, itemId]
  );
  return result.rows[0];
};

exports.deleteCartItem = async (itemId, userId) => {
  const result = await pool.query(
    'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *',
    [itemId, userId]
  );
  return result.rows[0];
};
