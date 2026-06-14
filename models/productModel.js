const prisma = require('../db/prisma');

exports.getAllProducts = async (
  search,
  category,
  in_stock,
  out_of_stock,
  is_best_selling,
  size,
  page = 1,
  limit = 12
) => {
  const where = {};

  // 🔍 Search: match product title OR variant name
  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        variants: {
          some: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      }
    ];
  }

  if (category) {
    where.categoryId = parseInt(category);
  }

  if (is_best_selling === "true") {
    where.variants = {
      some: {
        isBestSelling: true
      }
    };
  }

  // 🟢 In Stock - Check if any variant has stock > 0
  if (in_stock === "true") {
    where.variants = {
      some: {
        sizeOptions: {
          path: ['$[*].stock'],
          gte: 1
        }
      }
    };
  }
  // 🔴 Out of Stock - Check if no variant has stock > 0
  else if (out_of_stock === "true") {
    where.variants = {
      none: {
        sizeOptions: {
          path: ['$[*].stock'],
          gt: 0
        }
      }
    };
  }

  // 📏 Size filter - We'll handle this after the query since Prisma JSONB filtering is complex
  let sizeFilter = size;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
            description: true
          }
        },
        variants: {
          include: {
            reviews: {
              select: {
                rating: true,
                comment: true,
                createdAt: true,
                userId: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.product.count({ where })
  ]);

  // Filter by size if specified (after the query since Prisma JSONB filtering is complex)
  let filteredProducts = products;
  if (sizeFilter) {
    filteredProducts = products.filter(product => {
      return product.variants.some(variant => {
        if (variant.sizeOptions && Array.isArray(variant.sizeOptions)) {
          return variant.sizeOptions.some(option => option.size === sizeFilter);
        }
        return false;
      });
    });
  }

  // Calculate average rating for each product
  const productsWithRating = filteredProducts.map(product => {
    const allRatings = product.variants.flatMap(variant =>
      variant.reviews.map(review => review.rating)
    );

    const avgRating = allRatings.length > 0
      ? (allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length).toFixed(1)
      : null;

    // Add average rating to each variant
    const variantsWithRating = product.variants.map(variant => ({
      ...variant,
      average_rating: avgRating
    }));

    return {
      ...product,
      variants: variantsWithRating
    };
  });

  // Update total count for filtered results
  const finalTotalCount = sizeFilter ? productsWithRating.length : totalCount;

  return {
    products: productsWithRating,
    totalCount: finalTotalCount,
    page,
    totalPages: Math.ceil(finalTotalCount / parseInt(limit)),
  };
};


exports.getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: {
        select: {
          name: true,
          description: true
        }
      },
      variants: {
        include: {
          reviews: {
            select: {
              rating: true,
              comment: true,
              createdAt: true,
              userId: true
            }
          }
        }
      },
      reviews: {
        select: {
          rating: true,
          comment: true,
          createdAt: true,
          userId: true
        }
      }
    }
  });

  return product;
};


exports.getVariantsByProductId = async (productId) => {
  const result = await prisma.productVariant.findMany({
    where: { productId: parseInt(productId) }
  });

  return result;
};


exports.createProduct = async ({ title, description, imageurl, category_id, status = 'ACTIVE' }) => {
  const result = await prisma.product.create({
    data: {
      title,
      description,
      imageUrl: imageurl,
      categoryId: parseInt(category_id),
      status
    }
  });
  return result;
};

exports.updateProduct = async (id, { title, description, imageurl, category_id, status }) => {
  const result = await prisma.product.update({
    where: { id: parseInt(id) },
    data: {
      title,
      description,
      imageUrl: imageurl,
      categoryId: category_id ? parseInt(category_id) : undefined,
      status
    }
  });
  return result;
};

exports.deleteProduct = async (id) => {
  try {
    await prisma.$transaction(async (tx) => {
      // Delete variants first (due to foreign key constraint)
      await tx.productVariant.deleteMany({
        where: { productId: parseInt(id) }
      });

      // Delete the product
      await tx.product.delete({
        where: { id: parseInt(id) }
      });
    });
  } catch (err) {
    throw err;
  }
};

// Get reviews for a specific product
exports.getProductReviews = async (productId) => {
  const reviews = await prisma.review.findMany({
    where: { productId: parseInt(productId) },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      userId: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return reviews;
};

// Get reviews for a specific product variant
exports.getVariantReviews = async (variantId) => {
  const reviews = await prisma.review.findMany({
    where: { productVariantId: variantId },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      userId: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return reviews;
};

exports.getRelatedProductsByVariantId = async (variantId) => {
  const variant = await prisma.productVariant.findUnique({
    where: { id: parseInt(variantId) },
    select: {
      productId: true,
      product: {
        select: {
          categoryId: true
        }
      }
    }
  });

  if (!variant) {
    return null;
  }

  if (!variant.product) {
    return null;
  }

  if (!variant.product.categoryId) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      categoryId: variant.product?.categoryId,
      id: { not: variant.productId }
    },
    include: {
      category: {
        select: {
          name: true,
          description: true
        }
      },
      variants: {
        include: {
          reviews: {
            select: {
              rating: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 8
  });

  return products.map((product) => {
    const ratings = product.variants.flatMap((item) =>
      item.reviews.map((review) => review.rating)
    );
    const averageRating = ratings.length
      ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
      : null;

    return {
      ...product,
      category_name: product.category?.name,
      category_description: product.category?.description,
      variants: product.variants.map((item) => ({
        ...item,
        average_rating: averageRating
      }))
    };
  });
};
