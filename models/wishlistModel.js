const pool = require('../db');

const addToWishlist = async (userId, productId) => {
  return pool.query(
    'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, productId]
  );
};

const getUserWishlist = async (userId) => {
  return pool.query(
    `SELECT w.*, p.name, p.price, p.images 
     FROM wishlist w 
     JOIN products p ON p.id = w.product_id 
     WHERE w.user_id = $1`,
    [userId]
  );
};

const removeFromWishlist = async (userId, productId) => {
  return pool.query(
    'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );
};

const getAllWishlists = async () => {
  return pool.query(
    `SELECT w.*, u.email, p.name AS product_name 
     FROM wishlist w
     JOIN users u ON u.id = w.user_id
     JOIN products p ON p.id = w.product_id
     ORDER BY w.created_at DESC`
  );
};

module.exports = {
  addToWishlist,
  getUserWishlist,
  removeFromWishlist,
  getAllWishlists,
};
