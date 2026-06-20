const { z } = require('zod');
const { ChatGoogle } = require('@langchain/google');
const { config } = require('../config');

const styleFinderSchema = z.object({
  intro: z.string().max(220),
  recommendations: z.array(z.object({
    productId: z.number(),
    variantId: z.number(),
    reason: z.string().max(240),
    styleNote: z.string().max(180),
  })).max(6),
});

const reviewInsightsSchema = z.object({
  sentiment: z.enum(['positive', 'mixed', 'negative', 'no_data']),
  summary: z.string().max(500),
  topPraises: z.array(z.string().max(160)).max(5),
  topComplaints: z.array(z.string().max(160)).max(5),
  affectedItems: z.array(z.string().max(120)).max(6),
  suggestedActions: z.array(z.string().max(180)).max(5),
});

const ensureAiConfig = () => {
  if (!config.ai.googleApiKey) {
    const error = new Error('GOOGLE_API_KEY is not configured');
    error.statusCode = 503;
    throw error;
  }
};

const getModel = () => {
  ensureAiConfig();
  return new ChatGoogle({
    model: config.ai.model,
    apiKey: config.ai.googleApiKey,
    temperature: 0.25,
  });
};

const runStyleFinder = async ({ query, filters, candidates }) => {
  const candidateSummaries = candidates.map((candidate) => ({
    productId: candidate.productId,
    variantId: candidate.variantId,
    title: candidate.title,
    variantName: candidate.variantName,
    category: candidate.categoryName,
    price: candidate.price,
    sizes: candidate.sizeOptions.map((option) => ({
      size: option.size,
      price: Number(option.price || 0),
      stock: Number(option.stock || 0),
    })),
    bestSelling: candidate.isBestSelling,
    averageRating: candidate.averageRating,
    reviewCount: candidate.reviewCount,
    description: [candidate.productDescription, candidate.variantDescription].filter(Boolean).join(' '),
  }));

  const model = getModel().withStructuredOutput(styleFinderSchema, {
    name: 'style_finder_response',
  });

  return model.invoke([
    {
      role: 'system',
      content: 'You are Manthetic shopping assistant for men fashion. Recommend only products from the provided candidate list. Do not invent IDs. Keep reasons specific and practical.',
    },
    {
      role: 'user',
      content: JSON.stringify({ query, filters, candidates: candidateSummaries }),
    },
  ]);
};

const runReviewInsights = async ({ reviews }) => {
  if (!reviews.length) {
    return {
      sentiment: 'no_data',
      summary: 'No reviews were found for the selected range.',
      topPraises: [],
      topComplaints: [],
      affectedItems: [],
      suggestedActions: ['Collect more reviews before making product decisions.'],
    };
  }

  const reviewPayload = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    date: review.createdAt,
    product: review.product?.title || null,
    variant: review.product_variants?.name || null,
  }));

  const model = getModel().withStructuredOutput(reviewInsightsSchema, {
    name: 'review_insights_response',
  });

  return model.invoke([
    {
      role: 'system',
      content: 'You summarize ecommerce reviews for an admin. Use only the supplied reviews. Keep output operational, concise, and action-oriented.',
    },
    {
      role: 'user',
      content: JSON.stringify({ reviews: reviewPayload }),
    },
  ]);
};

module.exports = {
  runStyleFinder,
  runReviewInsights,
};