const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem
} = require('../controller/cartController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { addToCartSchema, updateCartItemSchema } = require('../validation/cartValidation');

router.get('/', protect, getCart);
router.post('/', protect, validateRequest(addToCartSchema), addToCart);
router.put('/:id', protect, validateRequest(updateCartItemSchema), updateCartItem);
router.delete('/:id', protect, deleteCartItem);

module.exports = router;
