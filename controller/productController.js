const ProductModel = require('../models/productModel');
const fs = require('fs');
const cloudinary = require('../utils/cloudinary');

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
