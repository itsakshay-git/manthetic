const express = require('express');
const router = express.Router();
const { addReview, getReviewsByProduct, deleteUserReview, getAllReviews, adminDeleteReview, getReviewsByUser, updateReview } = require('../controller/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { createReviewSchema, updateReviewSchema } = require('../validation/reviewValidation');


router.post('/add', protect, validateRequest(createReviewSchema), addReview);
router.get('/product/:productId', getReviewsByProduct);
router.delete('/delete/:reviewId', protect, deleteUserReview);

router.get("/user/:userId", protect, getReviewsByUser);
router.put("/:id", protect, validateRequest(updateReviewSchema), updateReview);

router.get('/admin/all', protect, isAdmin, getAllReviews);
router.delete('/admin/delete/:reviewId', protect, isAdmin, adminDeleteReview);

module.exports = router;
