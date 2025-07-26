const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem
} = require('../controller/cartController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.put('/:id', protect, updateCartItem);
router.delete('/:id', protect, deleteCartItem);

module.exports = router;
