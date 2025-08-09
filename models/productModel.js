const pool = require('../db');

// exports.getAllProducts = async (search, category) => {
//   let baseQuery = `
//     SELECT 
//       p.*, 
//       c.name AS category_name, 
//       c.description AS category_description
//     FROM products p
//     LEFT JOIN categories c ON p.category_id = c.id
//   `;

//   let conditions = [];
//   let values = [];

//   if (search) {
//     conditions.push(`LOWER(p.title) LIKE $${values.length + 1}`);
//     values.push(`%${search.toLowerCase()}%`);
//   }

//   if (category) {
//     conditions.push(`p.category_id = $${values.length + 1}`);
//     values.push(category);
//   }

//   if (conditions.length) {
//     baseQuery += ' WHERE ' + conditions.join(' AND ');
//   }

//   const productResult = await pool.query(baseQuery, values);
//   const products = productResult.rows;

//   for (let product of products) {
//     const variantResult = await pool.query(
//       `SELECT * FROM product_variants WHERE product_id = $1`,
//       [product.id]
//     );
//     product.variants = variantResult.rows;
//   }

//   return products;
// };


// exports.getAllProducts = async (search, category) => {
//   let baseQuery = `
//     SELECT 
//       p.*, 
//       c.name AS category_name, 
//       c.description AS category_description
//     FROM products p
//     LEFT JOIN categories c ON p.category_id = c.id
//   `;

//   let conditions = [];
//   let values = [];

//   if (search) {
//     conditions.push(`LOWER(p.title) LIKE $${values.length + 1}`);
//     values.push(`%${search.toLowerCase()}%`);
//   }

//   if (category) {
//     conditions.push(`p.category_id = $${values.length + 1}`);
//     values.push(category);
//   }

//   if (conditions.length) {
//     baseQuery += ' WHERE ' + conditions.join(' AND ');
//   }

//   const productResult = await pool.query(baseQuery, values);
//   const products = productResult.rows;

//   for (let product of products) {
//     // Fetch all variants for this product
//     const variantResult = await pool.query(
//       `SELECT * FROM product_variants WHERE product_id = $1`,
//       [product.id]
//     );
//     const variants = variantResult.rows;

//     // Fetch all reviews for this product
//     const reviewResult = await pool.query(
//       `SELECT rating FROM reviews WHERE product_id = $1`,
//       [product.id]
//     );
//     const ratings = reviewResult.rows.map(r => r.rating);

//     // Calculate average rating for the product overall
//     const avgRating =
//       ratings.length > 0
//         ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
//         : null;

//     // Add average rating to each variant
//     product.variants = variants.map(variant => ({
//       ...variant,
//       average_rating: avgRating
//     }));
//   }

//   return products;
// };

exports.getAllProducts = async (search, category, in_stock, out_of_stock, is_best_selling, size, page = 1, limit = 12) => {
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

if (is_best_selling === 'true') {
  conditions.push(`EXISTS (
    SELECT 1 FROM product_variants pv 
    WHERE pv.product_id = p.id AND pv.is_best_selling = true
  )`);
}

if (in_stock === 'true') {
  conditions.push(`EXISTS (
    SELECT 1 FROM product_variants pv 
    WHERE pv.product_id = p.id AND pv.stock > 0
  )`);
}

if (out_of_stock === 'true') {
  conditions.push(`EXISTS (
    SELECT 1 FROM product_variants pv 
    WHERE pv.product_id = p.id AND pv.stock = 0
  )`);
}

if (size) {
  conditions.push(`EXISTS (
    SELECT 1 FROM product_variants pv 
    WHERE pv.product_id = p.id AND pv.size = $${values.length + 1}
  )`);
  values.push(size);
}

  if (conditions.length) {
    baseQuery += ' WHERE ' + conditions.join(' AND ');
  }

  // Total count for pagination
  let countQuery = `SELECT COUNT(*) FROM products p`;
  if (conditions.length) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }
  const countResult = await pool.query(countQuery, values);
  const totalCount = parseInt(countResult.rows[0].count);

  // Add pagination
  const offset = (page - 1) * limit;
  baseQuery += ` ORDER BY p.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  const productResult = await pool.query(baseQuery, values);
  const products = productResult.rows;

  for (let product of products) {
    const variantResult = await pool.query(
      `SELECT * FROM product_variants WHERE product_id = $1`,
      [product.id]
    );
    const variants = variantResult.rows;

    const reviewResult = await pool.query(
      `SELECT rating FROM reviews WHERE product_id = $1`,
      [product.id]
    );
    const ratings = reviewResult.rows.map(r => r.rating);

    const avgRating =
      ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
        : null;

    product.variants = variants.map(variant => ({
      ...variant,
      average_rating: avgRating
    }));
  }

  return {
    products,
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
  };
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


exports.getVariantsByProductId = async (productId) => {
  const result = await pool.query(
    `SELECT * FROM product_variants WHERE product_id = $1`,
    [productId]
  );

  return result.rows;
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
