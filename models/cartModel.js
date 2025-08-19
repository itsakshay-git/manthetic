const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.getCartItemsByUserId = async (userId) => {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: parseInt(userId) },
    include: {
      variant: {
        include: {
          product: {
            select: {
              title: true
            }
          }
        }
      }
    }
  });

  // Map the result to match the expected format
  const mappedItems = cartItems.map(item => {

    return {
      id: item.id,
      variant_id: item.variantId, // This should match the Prisma field name
      quantity: item.quantity,
      selected_size: item.selectedSize,
      selected_price: item.selectedPrice,
      variant_name: item.variant?.name,
      images: item.variant?.images || [],
      product_title: item.variant?.product?.title
    };
  });

  return mappedItems;
};

exports.getExistingCartItem = async (userId, variantId, selectedSize) => {
  const result = await prisma.cartItem.findFirst({
    where: {
      userId: parseInt(userId),
      variantId: parseInt(variantId),
      selectedSize: selectedSize
    }
  });
  return result;
};

exports.insertCartItem = async (userId, variantId, quantity, selectedSize, selectedPrice) => {
  const result = await prisma.cartItem.create({
    data: {
      userId: parseInt(userId),
      variantId: parseInt(variantId),
      quantity: parseInt(quantity),
      selectedSize: selectedSize,
      selectedPrice: parseFloat(selectedPrice)
    }
  });
  return result;
};

exports.updateCartItemQuantity = async (itemId, quantity, userId) => {
  const result = await prisma.cartItem.update({
    where: {
      id: parseInt(itemId),
      userId: parseInt(userId)
    },
    data: {
      quantity: parseInt(quantity)
    }
  });
  return result;
};

exports.incrementCartItemQuantity = async (itemId, quantity) => {
  // Get current cart item
  const currentItem = await prisma.cartItem.findUnique({
    where: { id: parseInt(itemId) }
  });

  if (!currentItem) {
    throw new Error('Cart item not found');
  }

  // Update with incremented quantity
  const result = await prisma.cartItem.update({
    where: { id: parseInt(itemId) },
    data: {
      quantity: currentItem.quantity + parseInt(quantity)
    }
  });
  return result;
};

exports.deleteCartItem = async (itemId, userId) => {
  const result = await prisma.cartItem.delete({
    where: {
      id: parseInt(itemId),
      userId: parseInt(userId)
    }
  });
  return result;
};
