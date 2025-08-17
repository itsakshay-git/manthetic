const reviewModel = require('../models/reviewModel');

exports.addReview = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { product_id, variant_id, rating, comment } = req.body; // variant_id added

    await reviewModel.addReview({ user_id, product_id, variant_id, rating, comment });
    res.status(200).json({ message: 'Review added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding review' });
  }
};

exports.getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await reviewModel.getReviewsByProduct(req.params.productId);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching reviews' });
  }
};

exports.deleteUserReview = async (req, res) => {
  try {
    const user_id = req.user.id;
    await reviewModel.deleteUserReview(req.params.reviewId, user_id);
    res.status(200).json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting review' });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await reviewModel.getAllReviews();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching all reviews' });
  }
};

exports.adminDeleteReview = async (req, res) => {
  try {
    await reviewModel.adminDeleteReview(req.params.reviewId);
    res.status(200).json({ message: 'Review deleted by admin' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting review' });
  }
};

exports.getReviewsByUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const reviews = await reviewModel.getReviewsByUser(userId);
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching user reviews" });
  }
};

// Update a review by review ID
exports.updateReview = async (req, res) => {
  const reviewId = req.params.id;
  const { rating, comment } = req.body;

  if (!rating && !comment) {
    return res.status(400).json({ error: "Please provide rating or comment to update" });
  }

  try {
    const updatedReview = await reviewModel.updateReview(reviewId, { rating, comment });
    res.json(updatedReview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating review" });
  }
};
