const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const addToWishlist = async (userId, productId, variantId) => {
  try {
    const result = await prisma.wishlistItem.create({
      data: {
        userId: parseInt(userId),
        productId: parseInt(productId),
        variant_id: parseInt(variantId)
      }
    });
    return { rows: [result] };
  } catch (error) {
    // Handle unique constraint violation (ON CONFLICT DO NOTHING equivalent)
    if (error.code === 'P2002') {
      return { rows: [] };
    }
    throw error;
  }
};

const getUserWishlist = async (userId, page = 1, limit = 12) => {
  // Ensure page and limit are valid numbers with defaults
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 12;
  const offset = (pageNum - 1) * limitNum;

  // Count total wishlist items
  const totalCount = await prisma.wishlistItem.count({
    where: { userId: parseInt(userId) }
  });

  // Fetch wishlist items with product and variant details
  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: parseInt(userId) },
    include: {
      product: {
        select: {
          id: true,
          title: true
        }
      },
      product_variants: {
        select: {
          id: true,
          name: true,
          images: true,
          sizeOptions: true,
          isBestSelling: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limitNum,
    skip: offset
  });

  // Get average ratings for products
  const productsWithRatings = await Promise.all(
    wishlistItems.map(async (item) => {
      const reviews = await prisma.review.findMany({
        where: { productId: item.productId },
        select: { rating: true }
      });

      const averageRating = reviews.length > 0
        ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
        : null;

      return {
        id: item.product.id,
        title: item.product.title,
        wishlist_id: item.id,
        variants: [
          {
            id: item.product_variants.id,
            name: item.product_variants.name,
            images: item.product_variants.images || [],
            sizeOptions: item.product_variants.sizeOptions || [],
            is_best_selling: item.product_variants.isBestSelling,
            average_rating: averageRating,
          },
        ],
      };
    })
  );

  return {
    products: productsWithRatings,
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / limitNum),
  };
};

const removeFromWishlist = async (userId, productId) => {
  try {
    const result = await prisma.wishlistItem.deleteMany({
      where: {
        userId: parseInt(userId),
        productId: parseInt(productId)
      }
    });
    return { rows: [{ deletedCount: result.count }] };
  } catch (error) {
    console.error('Error in removeFromWishlist:', error);
    return { rows: [{ deletedCount: 0 }] };
  }
};

const getAllWishlists = async () => {
  const wishlists = await prisma.wishlistItem.findMany({
    include: {
      product: {
        select: {
          title: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Transform to match expected format
  const transformedWishlists = wishlists.map(wishlist => ({
    ...wishlist,
    email: 'User email not available', // Since there's no direct user relation
    product_name: wishlist.product?.title
  }));

  return { rows: transformedWishlists };
};

module.exports = {
  addToWishlist,
  getUserWishlist,
  removeFromWishlist,
  getAllWishlists,
};
