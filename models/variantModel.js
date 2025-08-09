const pool = require('../db');

exports.getVariantsByProduct = async (product_id) => {
  const result = await pool.query(
    'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id DESC',
    [product_id]
  );
  return result.rows;
};

exports.getVariantById = async (id) => {
  const variantResult = await pool.query(
    `SELECT id, product_id, name, description, images, is_best_selling, size_options
     FROM product_variants WHERE id = $1`,
    [id]
  );

  const variant = variantResult.rows[0];
  if (!variant) {
    throw new Error('Variant not found');
  }

  const reviewResult = await pool.query(
    `SELECT r.id, r.user_id, r.product_id, r.product_variant_id, r.rating, r.comment, r.created_at, u.name AS user_name
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.product_variant_id = $1`,
    [id]
  );

  variant.reviews = reviewResult.rows;

  return variant;
};


// exports.createVariant = async ({
//   product_id,
//   size,
//   price,
//   stock,
//   images,
//   is_best_selling,
//   name,
//   description,
// }) => {
//   const result = await pool.query(
//     `INSERT INTO product_variants 
//       (product_id, size, price, stock, images, is_best_selling, name, description)
//      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
//      RETURNING *`,
//     [
//       product_id,
//       size,
//       price,
//       stock,
//       images,
//       is_best_selling || false,
//       name || null,
//       description || null,
//     ]
//   );
//   return result.rows[0];
// };

exports.createVariant = async ({
  product_id, name, description,
  images, is_best_selling, size_options
}) => {
  const result = await pool.query(
    `INSERT INTO product_variants 
      (product_id, name, description, images, is_best_selling, size_options)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [product_id, name, description, images, is_best_selling || false, size_options]
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


// exports.updateVariant = async (
//   id,
//   { size, price, stock, images, is_best_selling, name, description }
// ) => {
//   const result = await pool.query(
//     `UPDATE product_variants 
//      SET size = $1,
//          price = $2,
//          stock = $3,
//          images = $4,
//          is_best_selling = $5,
//          name = $6,
//          description = $7
//      WHERE id = $8
//      RETURNING *`,
//     [
//       size,
//       price,
//       stock,
//       images || [],
//       is_best_selling || false,
//       name || null,
//       description || null,
//       id,
//     ]
//   );
//   return result.rows[0];
// };

exports.updateVariant = async (id, {
  name, description, images, is_best_selling, size_options
}) => {
  const result = await pool.query(
    `UPDATE product_variants
     SET name = $1,
         description = $2,
         images = $3,
         is_best_selling = $4,
         size_options = $5
     WHERE id = $6
     RETURNING *`,
    [name, description, images || [], is_best_selling || false, size_options, id]
  );
  return result.rows[0];
};


exports.deleteVariant = async (id) => {
  await pool.query('DELETE FROM product_variants WHERE id = $1', [id]);
};
