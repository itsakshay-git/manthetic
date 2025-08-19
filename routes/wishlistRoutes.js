const express = require('express');
const router = express.Router();
const { addToWishlist, getUserWishlist, removeFromWishlist, getAllWishlists, removeFromUserWishlist } = require('../controller/wishlistController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { addToWishlistSchema } = require('../validation/wishlistValidation');


router.post('/', protect, validateRequest(addToWishlistSchema), addToWishlist);
router.get('/', protect, getUserWishlist);
router.delete('/', protect, removeFromUserWishlist);
router.delete('/:productId', protect, removeFromWishlist);

router.get('/admin/all', protect, getAllWishlists);

module.exports = router;
