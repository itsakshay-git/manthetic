const cartModel = require('../models/cartModel');

exports.getCart = async (req, res) => {
  const items = await cartModel.getCartItemsByUserId(req.user.id);
  res.json(items);
};

// exports.addToCart = async (req, res) => {
//   const { variant_id, quantity } = req.body;

//   const existingItem = await cartModel.getExistingCartItem(req.user.id, variant_id);

//   if (existingItem) {
//     const updated = await cartModel.incrementCartItemQuantity(existingItem.id, quantity);
//     return res.json(updated);
//   }

//   const newItem = await cartModel.insertCartItem(req.user.id, variant_id, quantity);
//   res.status(201).json(newItem);
// };

exports.addToCart = async (req, res) => {
  const { variant_id, quantity, selected_size, selected_price } = req.body;

  const existingItem = await cartModel.getExistingCartItem(
    req.user.id,
    variant_id,
    selected_size // check uniqueness by variant_id + size
  );

  if (existingItem) {
    const updated = await cartModel.incrementCartItemQuantity(existingItem.id, quantity);
    return res.json(updated);
  }

  const newItem = await cartModel.insertCartItem(
    req.user.id,
    variant_id,
    quantity,
    selected_size,
    selected_price
  );
  res.status(201).json(newItem);
};

exports.updateCartItem = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const updated = await cartModel.updateCartItemQuantity(id, quantity, req.user.id);

  if (!updated) {
    return res.status(404).json({ msg: 'Cart item not found or unauthorized' });
  }

  res.json(updated);
};

exports.deleteCartItem = async (req, res) => {
  const { id } = req.params;

  const deleted = await cartModel.deleteCartItem(id, req.user.id);

  if (!deleted) {
    return res.status(404).json({ msg: 'Cart item not found or unauthorized' });
  }

  res.json({ msg: 'Item removed from cart' });
};
