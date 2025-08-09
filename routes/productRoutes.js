const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controller/productController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { getVariantsByProductId } = require('../controller/productController');

router.get('/', getProducts);
// router.get('/:id', getProductById);
router.get('/:id/variants', getVariantsByProductId);

router.post('/admin/products', protect, isAdmin, upload.single('image'), createProduct);
router.put('/admin/products/:id', protect, isAdmin,upload.single('image'), updateProduct);
router.delete('/admin/products/:id', protect, isAdmin, deleteProduct);

module.exports = router;
