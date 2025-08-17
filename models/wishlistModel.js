const pool = require('../db');

const addToWishlist = async (userId, productId, variantId) => {
  return pool.query(
    `INSERT INTO wishlist (user_id, product_id, variant_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, variant_id) DO NOTHING`,
    [userId, productId, variantId]
  );
};

const getUserWishlist = async (userId, page = 1, limit = 12) => {
  const offset = (page - 1) * limit;

  // Count total wishlist items
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM wishlist WHERE user_id = $1`,
    [userId]
  );
  const totalCount = parseInt(countResult.rows[0].count);


  // Fetch wishlist items with average rating in a single query
  const wishlistQuery = `
    SELECT 
      w.id AS wishlist_id,
      p.id AS product_id,
      p.title,
      v.id AS variant_id,
      v.name AS variant_name,
      v.images AS variant_images,
      v.size_options AS variant_size_options,
      v.is_best_selling AS variant_is_best_selling,
      COALESCE(ROUND(AVG(r.rating)::numeric, 1), null) AS average_rating
    FROM wishlist w
    JOIN products p ON p.id = w.product_id
    JOIN product_variants v ON v.id = w.variant_id
    LEFT JOIN reviews r ON r.product_id = p.id
    WHERE w.user_id = $1
    GROUP BY w.id, p.id, v.id
    ORDER BY w.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const wishlistResult = await pool.query(wishlistQuery, [userId, limit, offset]);

  // Map rows to ProductCard format
  const products = wishlistResult.rows.map(row => ({
    id: row.product_id,
    title: row.title,
    wishlist_id: row.wishlist_id,
    variants: [
      {
        id: row.variant_id,
        name: row.variant_name,
        images: row.variant_images,
        size_options: row.variant_size_options,
        is_best_selling: row.variant_is_best_selling,
        average_rating: row.average_rating,
      },
    ],
  }));

  return {
    products,
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
  };
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
