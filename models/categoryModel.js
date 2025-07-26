const pool = require('../db');

exports.getAll = async () => {
  const result = await pool.query('SELECT * FROM categories ORDER BY created_at DESC');
  return result.rows;
};

exports.getById = async (id) => {
  const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
  return result.rows[0];
};

exports.create = async (name, description) => {
  const result = await pool.query(
    'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
    [name, description]
  );
  return result.rows[0];
};

exports.update = async (id, name, description) => {
  const result = await pool.query(
    `UPDATE categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $3 RETURNING *`,
    [name, description, id]
  );
  return result.rows[0];
};

exports.delete = async (id) => {
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
};
