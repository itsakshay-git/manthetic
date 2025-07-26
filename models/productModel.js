const pool = require('../db');

exports.getAllProducts = async (search, category) => {
  let baseQuery = `
    SELECT 
      p.*, 
      c.name AS category_name, 
      c.description AS category_description
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
  `;

  let conditions = [];
  let values = [];

  if (search) {
    conditions.push(`LOWER(p.title) LIKE $${values.length + 1}`);
    values.push(`%${search.toLowerCase()}%`);
  }

  if (category) {
    conditions.push(`p.category_id = $${values.length + 1}`);
    values.push(category);
  }

  if (conditions.length) {
    baseQuery += ' WHERE ' + conditions.join(' AND ');
  }

  const productResult = await pool.query(baseQuery, values);
  const products = productResult.rows;

  for (let product of products) {
    const variantResult = await pool.query(
      `SELECT * FROM product_variants WHERE product_id = $1`,
      [product.id]
    );
    product.variants = variantResult.rows;
  }

  return products;
};

exports.getProductById = async (id) => {
  const productResult = await pool.query(`
    SELECT 
      p.*, 
      c.name AS category_name, 
      c.description AS category_description
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = $1
  `, [id]);

  const product = productResult.rows[0];

  if (product) {
    const variantResult = await pool.query(
      `SELECT * FROM product_variants WHERE product_id = $1`,
      [product.id]
    );
    product.variants = variantResult.rows;
  }

  return product;
};


exports.createProduct = async ({ title, description, imageurl, category_id, status = 'ACTIVE' }) => {
  const result = await pool.query(
    `INSERT INTO products (title, description, imageurl, category_id, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [title, description, imageurl, category_id, status]
  );
  return result.rows[0];
};

exports.updateProduct = async (id, { title, description, imageurl, category_id, status }) => {
  const result = await pool.query(
    `UPDATE products SET title=$1, description=$2, imageurl=$3, category_id=$4, status=$5 WHERE id=$6 RETURNING *`,
    [title, description, imageurl, category_id, status, id]
  );
  return result.rows[0];
};

exports.deleteProduct = async (id) => {
  console.log(id)
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`DELETE FROM product_variants WHERE product_id = $1`, [id]);

    await client.query(`DELETE FROM products WHERE id = $1`, [id]);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
