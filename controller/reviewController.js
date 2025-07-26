const reviewModel = require('../models/reviewModel');

exports.addReview = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { product_id, rating, comment } = req.body;
    await reviewModel.addReview({ user_id, product_id, rating, comment });
    res.status(200).json({ message: 'Review added' });
  } catch (err) {
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
