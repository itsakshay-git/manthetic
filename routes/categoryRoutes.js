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
const { validateRequest } = require('../middleware/validationMiddleware');
const { createCategorySchema, updateCategorySchema } = require('../validation/categoryValidation');
const upload = require('../middleware/multer');

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

router.post('/admin/categories', protect, isAdmin, upload.single('image'), validateRequest(createCategorySchema), createCategory);
router.put('/admin/categories/:id', protect, isAdmin, upload.single('image'), validateRequest(updateCategorySchema), updateCategory);
router.delete('/admin/categories/:id', protect, isAdmin, deleteCategory);

module.exports = router;
