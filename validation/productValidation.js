const Joi = require('joi');

// Create product validation schema
const createProductSchema = Joi.object({
    title: Joi.string().min(3).max(100).required().messages({
        'string.min': 'Title must be at least 3 characters long',
        'string.max': 'Title cannot exceed 100 characters',
        'any.required': 'Title is required'
    }),
    description: Joi.string().min(10).max(1000).required().messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 1000 characters',
        'any.required': 'Description is required'
    }),
    category_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be positive',
        'any.required': 'Category ID is required'
    }),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE').messages({
        'any.only': 'Status must be either ACTIVE or INACTIVE'
    })
});

// Update product validation schema
const updateProductSchema = Joi.object({
    title: Joi.string().min(3).max(100).messages({
        'string.min': 'Title must be at least 3 characters long',
        'string.max': 'Title cannot exceed 100 characters'
    }),
    description: Joi.string().min(10).max(1000).messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 1000 characters'
    }),
    category_id: Joi.number().integer().positive().messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be positive'
    }),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').messages({
        'any.only': 'Status must be either ACTIVE or INACTIVE'
    })
});

module.exports = {
    createProductSchema,
    updateProductSchema
};
