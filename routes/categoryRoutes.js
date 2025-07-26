const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controller/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

router.post('/admin/categories', protect, isAdmin, createCategory);
router.put('/admin/categories/:id', protect, isAdmin, updateCategory);
router.delete('/admin/categories/:id', protect, isAdmin, deleteCategory);

module.exports = router;
