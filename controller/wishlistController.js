const wishlistModel = require('../models/wishlistModel');

exports.addToWishlist = async (req, res) => {
  const { product_id } = req.body;
  const user_id = req.user.id;

  try {
    await wishlistModel.addToWishlist(user_id, product_id);
    res.status(200).json({ message: 'Added to wishlist' });
  } catch (err) {
    res.status(500).json({ error: 'Error adding to wishlist' });
  }
};

exports.getUserWishlist = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await wishlistModel.getUserWishlist(user_id);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching wishlist' });
  }
};

exports.removeFromWishlist = async (req, res) => {
  const { productId } = req.params;
  const user_id = req.user.id;

  try {
    await wishlistModel.removeFromWishlist(user_id, productId);
    res.status(200).json({ message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: 'Error removing from wishlist' });
  }
};

exports.getAllWishlists = async (req, res) => {
  try {
    const result = await wishlistModel.getAllWishlists();
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching all wishlists' });
  }
};
