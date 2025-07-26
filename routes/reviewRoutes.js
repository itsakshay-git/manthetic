const express = require('express');
const router = express.Router();
const {addReview, getReviewsByProduct, deleteUserReview, getAllReviews, adminDeleteReview} = require('../controller/reviewController');
const { protect } = require('../middleware/authMiddleware');


router.post('/add', protect, addReview);
router.get('/product/:productId', getReviewsByProduct);
router.delete('delete/:reviewId', protect, deleteUserReview);

router.get('/admin/all', protect, getAllReviews);
router.delete('/admin/delete/:reviewId', protect, adminDeleteReview);

module.exports = router;