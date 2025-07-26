const pool = require('../db');

exports.getVariantsByProduct = async (product_id) => {
  const result = await pool.query(
    'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id DESC',
    [product_id]
  );
  return result.rows;
};

exports.getVariantById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM product_variants WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

exports.createVariant = async ({
  product_id,
  size,
  price,
  stock,
  images,
  is_best_selling,
  name,
  description,
}) => {
  const result = await pool.query(
    `INSERT INTO product_variants 
      (product_id, size, price, stock, images, is_best_selling, name, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      product_id,
      size,
      price,
      stock,
      images,
      is_best_selling || false,
      name || null,
      description || null,
    ]
  );
  return result.rows[0];
};

exports.getAllVariantsProducts = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM product_variants`);
    
    return result.rows
  } catch (error) {
    console.error("Error fetching variants:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching variants.",
    });
  }
};


exports.updateVariant = async (
  id,
  { size, price, stock, images, is_best_selling, name, description }
) => {
  const result = await pool.query(
    `UPDATE product_variants 
     SET size = $1,
         price = $2,
         stock = $3,
         images = $4,
         is_best_selling = $5,
         name = $6,
         description = $7
     WHERE id = $8
     RETURNING *`,
    [
      size,
      price,
      stock,
      images || [],
      is_best_selling || false,
      name || null,
      description || null,
      id,
    ]
  );
  return result.rows[0];
};


exports.deleteVariant = async (id) => {
  await pool.query('DELETE FROM product_variants WHERE id = $1', [id]);
};
