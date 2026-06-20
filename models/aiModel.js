const prisma = require('../db/prisma');

const parseSizeOptions = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  return Number(value);
};

const getVariantPrice = (sizeOptions, size) => {
  const options = parseSizeOptions(sizeOptions);
  const available = options.filter((option) => Number(option.stock || 0) > 0);
  const source = available.length ? available : options;
  const matched = size
    ? source.find((option) => String(option.size || '').toLowerCase() === String(size).toLowerCase())
    : null;
  const option = matched || source[0];
  return option ? toNumber(option.price) : 0;
};

const getAverageRating = (reviews = []) => {
  const ratings = reviews.map((review) => Number(review.rating || 0)).filter(Boolean);
  if (!ratings.length) return 0;
  return Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10;
};

const getCatalogCandidates = async ({ categoryId, maxPrice, size }) => {
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      ...(categoryId ? { categoryId: Number(categoryId) } : {}),
    },
    include: {
      category: true,
      reviews: true,
      variants: {
        include: {
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 80,
  });

  return products.flatMap((product) => {
    return (product.variants || []).map((variant) => {
      const sizeOptions = parseSizeOptions(variant.sizeOptions);
      const price = getVariantPrice(sizeOptions, size);
      const reviewCount = (product.reviews?.length || 0) + (variant.reviews?.length || 0);
      const averageRating = getAverageRating([...(product.reviews || []), ...(variant.reviews || [])]);
      const hasStock = sizeOptions.some((option) => Number(option.stock || 0) > 0);

      return {
        productId: product.id,
        variantId: variant.id,
        title: product.title || '',
        productDescription: product.description || '',
        variantName: variant.name || '',
        variantDescription: variant.description || '',
        categoryName: product.category?.name || '',
        price,
        sizeOptions,
        hasStock,
        isBestSelling: Boolean(variant.isBestSelling),
        averageRating,
        reviewCount,
        imageUrl: product.imageUrl,
        variantImages: variant.images || [],
        product: {
          id: product.id,
          title: product.title,
          description: product.description,
          imageUrl: product.imageUrl,
          categoryId: product.categoryId,
          category_id: product.categoryId,
          variants: [
            {
              id: variant.id,
              productId: product.id,
              name: variant.name,
              description: variant.description,
              images: variant.images || [],
              is_best_selling: variant.isBestSelling,
              isBestSelling: variant.isBestSelling,
              sizeOptions,
              average_rating: averageRating || null,
            },
          ],
        },
      };
    });
  }).filter((candidate) => {
    if (maxPrice && candidate.price && candidate.price > Number(maxPrice)) return false;
    if (size) {
      return candidate.sizeOptions.some((option) => String(option.size || '').toLowerCase() === String(size).toLowerCase());
    }
    return true;
  }).slice(0, 30);
};

const getReviewInsightsData = async ({ productId, variantId, days = 90 }) => {
  const since = new Date();
  since.setDate(since.getDate() - Number(days || 90));

  return prisma.review.findMany({
    where: {
      ...(productId ? { productId: Number(productId) } : {}),
      ...(variantId ? { productVariantId: Number(variantId) } : {}),
      createdAt: { gte: since },
    },
    include: {
      product: true,
      product_variants: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 80,
  });
};

module.exports = {
  getCatalogCandidates,
  getReviewInsightsData,
};