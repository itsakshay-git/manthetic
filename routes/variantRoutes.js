const express = require('express');
const router = express.Router();
const {
  getVariantsByProduct,
  createVariant,
  getAllVariants,
  updateVariant,
  deleteVariant,
  upload,
  getVariantsById
} = require('../controller/variantController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { createVariantSchema, updateVariantSchema } = require('../validation/variantValidation');

router.get("/product/variants", getAllVariants);
router.get('/product/:id', getVariantsByProduct);
router.get('/variant/:id', getVariantsById);
router.post('/admin/variants', protect, isAdmin, upload.array('images'), validateRequest(createVariantSchema), createVariant);
router.put('/admin/variants/:id', protect, isAdmin, upload.array('images'), validateRequest(updateVariantSchema), updateVariant);
router.delete('/admin/variants/:id', protect, isAdmin, deleteVariant);

module.exports = router;