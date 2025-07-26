const {
  getVariantsByProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  getAllVariantsProducts,
  getVariantById
} = require('../models/variantModel');
const cloudinary = require('../utils/cloudinary');
const multer = require('multer');
const fs = require('fs');

exports.upload = multer({ dest: 'uploads/' });

exports.getVariantsByProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const variants = await getVariantsByProduct(id);
    res.json(variants);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching variants' });
  }
};

exports.getAllVariants = async (req, res) => {
  try {

    const variants = await getAllVariantsProducts();
    res.json(variants);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching variants' });
  }
};

exports.createVariant = async (req, res) => {
  try {
    const { product_id, size, price, stock, is_best_selling, name, description } = req.body;

    let imageLinks = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'manthetic/variants',
        });
        imageLinks.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
    }

    const variant = await createVariant({
      product_id,
      size,
      price,
      stock,
      images: imageLinks,
      is_best_selling,
      name,
      description,
    });

    res.status(201).json({ success: true, variant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating variant' });
  }
};


exports.updateVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      size,
      price,
      stock,
      is_best_selling,
      name,
      description,
      existingImages = "[]", // default to empty if not sent
    } = req.body;

    // Convert incoming types
    const updatedData = {
      size,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      is_best_selling: is_best_selling === 'true',
      name,
      description,
    };

    // Parse existingImages string into array
    let existingImageArray = [];
    try {
      existingImageArray = JSON.parse(existingImages); // Important!
    } catch (e) {
      console.warn("Failed to parse existingImages");
    }

    // Upload new files if any
    let newUploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'manthetic/variants',
        });
        newUploadedImages.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
    }

    // Combine both existing + new uploaded images
    const finalImageList = [...existingImageArray, ...newUploadedImages];
    if (finalImageList.length > 0) {
      updatedData.images = finalImageList;
    }

    // Proceed with update in DB
    const updated = await updateVariant(id, updatedData);
    res.status(200).json({ success: true, variant: updated });

  } catch (err) {
    console.error("Error updating variant:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


exports.deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteVariant(id);
    res.json({ msg: 'Variant deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting variant' });
  }
};
