const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
} = require('../controller/productController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { createProductSchema, updateProductSchema } = require('../validation/productValidation');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { getVariantsByProductId } = require('../controller/productController');

router.get('/', getProducts);
router.get('/product/:id', getProductById);
router.get('/:id/variants', getVariantsByProductId);
router.get('/related/:variantId', getRelatedProducts);

router.post('/admin/products', protect, isAdmin, upload.single('image'), validateRequest(createProductSchema), createProduct);
router.put('/admin/products/:id', protect, isAdmin, upload.single('image'), validateRequest(updateProductSchema), updateProduct);
router.delete('/admin/products/:id', protect, isAdmin, deleteProduct);

module.exports = router;
