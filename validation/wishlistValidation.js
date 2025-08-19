const Joi = require('joi');

// Add to wishlist validation schema
const addToWishlistSchema = Joi.object({
    product_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be positive',
        'any.required': 'Product ID is required'
    }),
    variant_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Variant ID must be a number',
        'number.integer': 'Variant ID must be an integer',
        'number.positive': 'Variant ID must be positive',
        'any.required': 'Variant ID is required'
    })
});

module.exports = {
    addToWishlistSchema
};
