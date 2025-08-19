const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.getVariantsByProduct = async (product_id) => {
  const result = await prisma.productVariant.findMany({
    where: { productId: parseInt(product_id) },
    orderBy: { id: 'desc' }
  });
  return result;
};

exports.getVariantById = async (id) => {
  console.log('Fetching variant with ID:', id);

  const variant = await prisma.productVariant.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      productId: true,
      name: true,
      description: true,
      images: true,
      isBestSelling: true,
      sizeOptions: true
    }
  });

  if (!variant) {
    throw new Error('Variant not found');
  }

  console.log('Found variant:', variant);

  // Get reviews for this variant with user names
  const reviews = await prisma.review.findMany({
    where: { productVariantId: parseInt(id) },
    select: {
      id: true,
      userId: true,
      productId: true,
      productVariantId: true,
      rating: true,
      comment: true,
      createdAt: true
    }
  });

  // Debug: Check all reviews to see what's in the database
  const allReviews = await prisma.review.findMany({
    select: {
      id: true,
      productVariantId: true,
      productId: true,
      rating: true,
      comment: true
    }
  });

  // Get user names for reviews and map fields to match frontend expectations
  const reviewsWithUserNames = await Promise.all(
    reviews.map(async (review) => {
      if (review.userId) {
        const user = await prisma.user.findUnique({
          where: { id: review.userId },
          select: { name: true }
        });
        return {
          id: review.id,
          user_id: review.userId,
          product_id: review.productId,
          product_variant_id: review.productVariantId,
          rating: review.rating,
          comment: review.comment,
          created_at: review.createdAt, // Map to frontend expected field
          user_name: user?.name || 'Unknown User'
        };
      }
      return {
        id: review.id,
        user_id: review.userId,
        product_id: review.productId,
        product_variant_id: review.productVariantId,
        rating: review.rating,
        comment: review.comment,
        created_at: review.createdAt, // Map to frontend expected field
        user_name: 'Unknown User'
      };
    })
  );

  variant.reviews = reviewsWithUserNames;

  return variant;
};

exports.createVariant = async ({
  product_id, name, description,
  images, is_best_selling, size_options
}) => {
  const result = await prisma.productVariant.create({
    data: {
      productId: parseInt(product_id),
      name,
      description,
      images: images || [],
      isBestSelling: is_best_selling === "true" || is_best_selling === true,
      sizeOptions: size_options || []
    }
  });
  return result;
};

exports.getAllVariantsProducts = async (req, res) => {
  try {
    const result = await prisma.productVariant.findMany();
    return result;
  } catch (error) {
    console.error("Error fetching variants:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching variants.",
    });
  }
};

exports.updateVariant = async (id, {
  name, description, images, is_best_selling, size_options
}) => {
  const result = await prisma.productVariant.update({
    where: { id: parseInt(id) },
    data: {
      name,
      description,
      images: images || [],
      isBestSelling: is_best_selling === "true" || is_best_selling === true,
      sizeOptions: size_options || []
    }
  });
  return result;
};

exports.deleteVariant = async (id) => {
  await prisma.productVariant.delete({
    where: { id: parseInt(id) }
  });
};
