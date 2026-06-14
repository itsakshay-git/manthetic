const Category = require('../models/categoryModel');
const cloudinary = require('../utils/cloudinary');
const { cleanupLocalFile } = require('../utils/uploadCleanup');

// Helper function to extract Cloudinary public ID from URL
const extractCloudinaryPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;

  try {
    // Extract the path after the last slash and remove file extension
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];

    // Find the folder path (manthetic/categories/...)
    const cloudinaryIndex = urlParts.findIndex(part => part === 'manthetic');
    if (cloudinaryIndex !== -1) {
      const folderPath = urlParts.slice(cloudinaryIndex, -1).join('/');
      return `${folderPath}/${publicId}`;
    }

    return `manthetic/categories/${publicId}`;
  } catch (error) {
    console.error('Error extracting Cloudinary public ID:', error);
    return null;
  }
};

exports.getAllCategories = async (req, res) => {
  const categories = await Category.getAll();
  res.json(categories);
};

exports.getCategoryById = async (req, res) => {
  const { id } = req.params;
  const category = await Category.getById(id);
  if (!category) return res.status(404).json({ msg: 'Category not found' });
  res.json(category);
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Handle image upload to Cloudinary
    let imageUrl = null;
    if (req.file) {
      try {
        cloudinary.ensureConfigured();
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'manthetic/categories',
          resource_type: 'auto'
        });

        imageUrl = result.secure_url;

      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
      } finally {
        cleanupLocalFile(req.file.path);
      }
    }

    const category = await Category.create(name, description, imageUrl);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Get current category to check if it has an old image
    const currentCategory = await Category.getById(id);
    if (!currentCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Handle image upload to Cloudinary
    let imageUrl = null;
    if (req.file) {
      try {
        cloudinary.ensureConfigured();
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'manthetic/categories',
          resource_type: 'auto'
        });

        imageUrl = result.secure_url;

        // Delete old image from Cloudinary if it exists
        if (currentCategory.image && currentCategory.image.includes('cloudinary.com')) {
          try {
            const publicId = extractCloudinaryPublicId(currentCategory.image);
            if (publicId) {
              await cloudinary.uploader.destroy(publicId);
            }
          } catch (deleteError) {
            console.error('Error deleting old image from Cloudinary:', deleteError);
            // Continue with update even if old image deletion fails
          }
        }

      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
      } finally {
        cleanupLocalFile(req.file.path);
      }
    } else {
      // Keep the existing image if no new image is provided
      imageUrl = currentCategory.image;
    }

    const updated = await Category.update(id, name, description, imageUrl);
    res.json(updated);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Get current category to check if it has an image
    const currentCategory = await Category.getById(id);
    if (!currentCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete image from Cloudinary if it exists
    if (currentCategory.image && currentCategory.image.includes('cloudinary.com')) {
      try {
        const publicId = extractCloudinaryPublicId(currentCategory.image);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (deleteError) {
        console.error('Error deleting image from Cloudinary:', deleteError);
        // Continue with category deletion even if image deletion fails
      }
    }

    // Delete the category from database
    await Category.delete(id);
    res.json({ msg: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
};
