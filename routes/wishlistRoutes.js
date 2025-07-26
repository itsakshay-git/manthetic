const express = require('express');
const router = express.Router();
const {addToWishlist, getUserWishlist, removeFromWishlist, getAllWishlists} = require('../controller/wishlistController');
const { protect } = require('../middleware/authMiddleware');


router.post('/', protect, addToWishlist);
router.get('/', protect, getUserWishlist);
router.delete('/:productId', protect, removeFromWishlist);

router.get('/admin/all', protect, getAllWishlists);

module.exports = router;
