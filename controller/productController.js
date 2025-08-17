const ProductModel = require('../models/productModel');
const fs = require('fs');
const cloudinary = require('../utils/cloudinary');
const pool = require('../db');

exports.getProducts = async (req, res) => {
  try {
const { search, category, page = 1, limit = 12, in_stock, out_of_stock, is_best_selling, size } = req.query;
const products = await ProductModel.getAllProducts(search, category, in_stock, out_of_stock, is_best_selling, size, parseInt(page), parseInt(limit));
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching products', error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.getProductById(id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching product', error: err.message });
  }
};

exports.getVariantsByProductId = async (req, res) => {
  try {
    const { id } = req.params;
    const variants = await ProductModel.getVariantsByProductId(id);

    if (!variants.length) {
      return res.status(404).json({ msg: 'No variants found for this product' });
    }

    res.json(variants);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching variants', error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { title, description, category_id, status = 'ACTIVE' } = req.body;
    let imageurl = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'manthetic/products',
      });
      imageurl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const product = await ProductModel.createProduct({
      title,
      description,
      imageurl,
      category_id,
      status,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating product' });
  }
};


exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, status = 'ACTIVE' } = req.body;
    let imageurl = req.body.imageurl || null;

    
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'manthetic/products',
      });
      imageurl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const updated = await ProductModel.updateProduct(id, {
      title,
      description,
      imageurl,
      category_id,
      status,
    });

    res.status(200).json({ success: true, product: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id)
    await ProductModel.deleteProduct(id);
    res.json({ msg: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Error deleting product', error: err.message });
  }
};


exports.getRelatedProducts = async (req, res) => {
  try {
    const { variantId } = req.params;

    // 1. Find product_id + category_id of the given variant
    const variantRes = await pool.query(
      `SELECT pv.product_id, p.category_id 
       FROM product_variants pv
       JOIN products p ON pv.product_id = p.id
       WHERE pv.id = $1`,
      [variantId]
    );

    if (!variantRes.rows.length) {
      return res.status(404).json({ msg: "Variant not found" });
    }

    const { product_id, category_id } = variantRes.rows[0];

    // 2. Fetch products from same category (excluding current product)
    const productRes = await pool.query(
      `SELECT p.*, c.name AS category_name, c.description AS category_description
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.category_id = $1 AND p.id <> $2
       ORDER BY p.created_at DESC
       LIMIT 8`,
      [category_id, product_id]
    );

    const products = productRes.rows;

    // 3. Attach variants + average rating
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
      const ratings = reviewResult.rows.map((r) => r.rating);

      const avgRating =
        ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
          : null;

      product.variants = variants.map((variant) => ({
        ...variant,
        average_rating: avgRating,
      }));
    }

    res.json({ products });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error fetching related products" });
  }
};

