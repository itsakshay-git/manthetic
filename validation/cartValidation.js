const Joi = require('joi');

// Add to cart validation schema
const addToCartSchema = Joi.object({
    variant_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Variant ID must be a number',
        'number.integer': 'Variant ID must be an integer',
        'number.positive': 'Variant ID must be positive',
        'any.required': 'Variant ID is required'
    }),
    quantity: Joi.number().integer().min(1).max(100).required().messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1',
        'number.max': 'Quantity cannot exceed 100',
        'any.required': 'Quantity is required'
    }),
    selected_size: Joi.string().required().messages({
        'any.required': 'Selected size is required'
    }),
    selected_price: Joi.number().positive().required().messages({
        'number.base': 'Selected price must be a number',
        'number.positive': 'Selected price must be positive',
        'any.required': 'Selected price is required'
    })
});

// Update cart item validation schema
const updateCartItemSchema = Joi.object({
    quantity: Joi.number().integer().min(1).max(100).required().messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1',
        'number.max': 'Quantity cannot exceed 100',
        'any.required': 'Quantity is required'
    })
});

module.exports = {
    addToCartSchema,
    updateCartItemSchema
};
