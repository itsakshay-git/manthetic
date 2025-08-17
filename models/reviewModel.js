const pool = require('../db');

exports.addReview = async ({ user_id, product_id, variant_id, rating, comment }) => {
  await pool.query(
    `INSERT INTO reviews (user_id, product_id, product_variant_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)`,
    [user_id, product_id, variant_id, rating, comment]
  );
};

exports.getReviewsByProduct = async (productId) => {
  const result = await pool.query(
    `SELECT r.*, u.name AS user_name 
     FROM reviews r 
     JOIN users u ON u.id = r.user_id 
     WHERE r.product_id = $1 
     ORDER BY r.created_at DESC`,
    [productId]
  );
  return result.rows;
};

exports.deleteUserReview = async (reviewId, user_id) => {
  await pool.query(
    'DELETE FROM reviews WHERE id = $1 AND user_id = $2',
    [reviewId, user_id]
  );
};

exports.getAllReviews = async () => {
  const result = await pool.query(
    `SELECT r.*, u.name AS user_name, p.title AS product_name 
     FROM reviews r 
     JOIN users u ON u.id = r.user_id 
     JOIN products p ON p.id = r.product_id 
     ORDER BY r.created_at DESC`
  );
  return result.rows;
};

exports.adminDeleteReview = async (reviewId) => {
  await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
};

exports.getReviewsByUser = async (userId) => {
  const result = await pool.query(
    `SELECT r.*, u.name AS user_name, v.name AS variant_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     JOIN product_variants v ON v.id = r.product_variant_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return result.rows;
};

// Update a review
exports.updateReview = async (reviewId, { rating, comment }) => {
  const fields = [];
  const values = [];
  let index = 1;

  if (rating !== undefined) {
    fields.push(`rating = $${index++}`);
    values.push(rating);
  }
  if (comment !== undefined) {
    fields.push(`comment = $${index++}`);
    values.push(comment);
  }
  values.push(reviewId); // for WHERE clause

  const query = `
    UPDATE reviews
    SET ${fields.join(", ")}
    WHERE id = $${index}
    RETURNING *;
  `;
  const result = await pool.query(query, values);
  return result.rows[0];
};
