const wishlistModel = require('../models/wishlistModel');

exports.addToWishlist = async (req, res) => {
  const { product_id, variant_id } = req.body;
  const user_id = req.user.id;

  if (!product_id || !variant_id) {
    return res.status(400).json({ error: "product_id and variant_id are required" });
  }

  try {
    const existing = await wishlistModel.findUserWishlistItem(user_id, variant_id);

    if (existing) {
      return res.status(409).json({ error: "Product already in wishlist" });
    }

    await wishlistModel.addToWishlist(user_id, product_id, variant_id);
    res.status(200).json({ message: "Added to wishlist" });

  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(500).json({ error: "Error adding to wishlist" });
  }
};

exports.getUserWishlist = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;

  try {
    const wishlistData = await wishlistModel.getUserWishlist(user_id, page, limit);

    res.status(200).json(wishlistData); 
    // wishlistData will have { products, totalCount, page, totalPages }
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(500).json({ error: 'Error fetching wishlist' });
  }
};

exports.removeFromUserWishlist = async (req, res) => {
  const { variant_id } = req.body;
  const user_id = req.user.id;

  if (!variant_id) {
    return res.status(400).json({ error: "variant_id is required" });
  }

  try {
    const existing = await wishlistModel.findUserWishlistItem(user_id, variant_id);

    if (!existing) {
      return res.status(404).json({ error: "Item not found in wishlist" });
    }

    await wishlistModel.removeUserWishlistItem(user_id, variant_id);

    res.status(200).json({ message: "Removed from wishlist" });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({ error: "Error removing from wishlist" });
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
