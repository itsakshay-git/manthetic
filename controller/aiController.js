const { z } = require('zod');
const aiModel = require('../models/aiModel');
const { runStyleFinder, runReviewInsights } = require('../services/aiService');

const styleFinderRequestSchema = z.object({
  query: z.string().trim().min(3).max(300),
  categoryId: z.coerce.number().int().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  size: z.string().trim().max(20).optional(),
});

const reviewInsightsRequestSchema = z.object({
  productId: z.coerce.number().int().positive().optional(),
  variantId: z.coerce.number().int().positive().optional(),
  days: z.coerce.number().int().positive().max(365).default(90),
});

const validateAiIds = (response, candidates) => {
  const byVariant = new Map(candidates.map((candidate) => [candidate.variantId, candidate]));
  const seen = new Set();

  return (response.recommendations || [])
    .map((item) => {
      const candidate = byVariant.get(Number(item.variantId));
      if (!candidate || seen.has(candidate.variantId)) return null;
      seen.add(candidate.variantId);
      return {
        productId: candidate.productId,
        variantId: candidate.variantId,
        reason: item.reason,
        styleNote: item.styleNote,
        product: candidate.product,
      };
    })
    .filter(Boolean);
};

exports.styleFinder = async (req, res, next) => {
  try {
    const parsed = styleFinderRequestSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid style finder request',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { query, categoryId, maxPrice, size } = parsed.data;
    const filters = { categoryId, maxPrice, size };
    const candidates = await aiModel.getCatalogCandidates(filters);

    if (!candidates.length) {
      return res.json({
        intro: 'I could not find matching catalog items for those filters.',
        recommendations: [],
      });
    }

    const aiResponse = await runStyleFinder({ query, filters, candidates });
    const recommendations = validateAiIds(aiResponse, candidates);

    res.json({
      intro: aiResponse.intro,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
};

exports.reviewInsights = async (req, res, next) => {
  try {
    const parsed = reviewInsightsRequestSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid review insights request',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const reviews = await aiModel.getReviewInsightsData(parsed.data);
    const insights = await runReviewInsights({ reviews });

    res.json({
      ...insights,
      reviewCount: reviews.length,
      filters: parsed.data,
    });
  } catch (error) {
    next(error);
  }
};