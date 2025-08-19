const Joi = require('joi');

// Create review validation schema
const createReviewSchema = Joi.object({
    product_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be positive',
        'any.required': 'Product ID is required'
    }),
    variant_id: Joi.number().integer().positive().optional().messages({
        'number.base': 'Product variant ID must be a number',
        'number.integer': 'Product variant ID must be an integer',
        'number.positive': 'Product variant ID must be positive'
    }),
    rating: Joi.number().integer().min(1).max(5).required().messages({
        'number.base': 'Rating must be a number',
        'number.integer': 'Rating must be an integer',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5',
        'any.required': 'Rating is required'
    }),
    comment: Joi.string().min(10).max(500).required().messages({
        'string.min': 'Comment must be at least 10 characters long',
        'string.max': 'Comment cannot exceed 500 characters',
        'any.required': 'Comment is required'
    })
});

// Update review validation schema
const updateReviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).messages({
        'number.base': 'Rating must be a number',
        'number.integer': 'Rating must be an integer',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5'
    }),
    comment: Joi.string().min(10).max(500).messages({
        'string.min': 'Comment must be at least 10 characters long',
        'string.max': 'Comment cannot exceed 500 characters'
    })
});

module.exports = {
    createReviewSchema,
    updateReviewSchema
};
