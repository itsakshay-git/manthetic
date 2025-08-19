const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.addReview = async ({ user_id, product_id, variant_id, rating, comment }) => {

  const reviewData = {
    userId: parseInt(user_id),
    productId: parseInt(product_id),
    productVariantId: variant_id ? parseInt(variant_id) : null,
    rating: parseInt(rating),
    comment
  };

  const result = await prisma.review.create({
    data: reviewData
  });

  return result;
};

exports.getReviewsByProduct = async (productId) => {
  const reviews = await prisma.review.findMany({
    where: { productId: parseInt(productId) },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Get user names for reviews
  const reviewsWithUserNames = await Promise.all(
    reviews.map(async (review) => {
      if (review.userId) {
        const user = await prisma.user.findUnique({
          where: { id: review.userId },
          select: { name: true }
        });
        return {
          ...review,
          user_name: user?.name || 'Unknown User'
        };
      }
      return {
        ...review,
        user_name: 'Unknown User'
      };
    })
  );

  return reviewsWithUserNames;
};

exports.deleteUserReview = async (reviewId, user_id) => {
  await prisma.review.deleteMany({
    where: {
      id: parseInt(reviewId),
      userId: parseInt(user_id)
    }
  });
};

exports.getAllReviews = async () => {
  const reviews = await prisma.review.findMany({
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

  // Get user names for reviews
  const reviewsWithUserNames = await Promise.all(
    reviews.map(async (review) => {
      let userName = 'Unknown User';
      if (review.userId) {
        const user = await prisma.user.findUnique({
          where: { id: review.userId },
          select: { name: true }
        });
        userName = user?.name || 'Unknown User';
      }

      return {
        ...review,
        user_name: userName,
        product_name: review.product?.title
      };
    })
  );

  return reviewsWithUserNames;
};

exports.adminDeleteReview = async (reviewId) => {
  await prisma.review.delete({
    where: { id: parseInt(reviewId) }
  });
};

exports.getReviewsByUser = async (userId) => {
  const reviews = await prisma.review.findMany({
    where: { userId: parseInt(userId) },
    include: {
      product_variants: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Get user names for reviews
  const reviewsWithUserNames = await Promise.all(
    reviews.map(async (review) => {
      let userName = 'Unknown User';
      if (review.userId) {
        const user = await prisma.user.findUnique({
          where: { id: review.userId },
          select: { name: true }
        });
        userName = user?.name || 'Unknown User';
      }

      return {
        ...review,
        user_name: userName,
        variant_name: review.product_variants?.name
      };
    })
  );

  return reviewsWithUserNames;
};

// Update a review
exports.updateReview = async (reviewId, { rating, comment }) => {
  const updateData = {};

  if (rating !== undefined) {
    updateData.rating = parseInt(rating);
  }
  if (comment !== undefined) {
    updateData.comment = comment;
  }

  const result = await prisma.review.update({
    where: { id: parseInt(reviewId) },
    data: updateData
  });

  return result;
};
