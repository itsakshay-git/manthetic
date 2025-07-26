const express = require('express');
const router = express.Router();
const {
  getVariantsByProduct,
  createVariant,
  getAllVariants,
  updateVariant,
  deleteVariant,
  upload
} = require('../controller/variantController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.get("/product/variants", getAllVariants);
router.get('/product/:id', getVariantsByProduct);
router.post('/admin/variants', protect, isAdmin, upload.array('images'), createVariant);
router.put('/admin/variants/:id', protect, isAdmin,upload.array('images'), updateVariant);
router.delete('/admin/variants/:id', protect, isAdmin, deleteVariant);

module.exports = router;