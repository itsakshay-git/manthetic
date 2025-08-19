const Joi = require('joi');

// Create category validation schema
const createCategorySchema = Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Category name must be at least 2 characters long',
        'string.max': 'Category name cannot exceed 50 characters',
        'any.required': 'Category name is required'
    }),
    description: Joi.string().min(10).max(500).required().messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 500 characters',
        'any.required': 'Description is required'
    })
});

// Update category validation schema
const updateCategorySchema = Joi.object({
    name: Joi.string().min(2).max(50).messages({
        'string.min': 'Category name must be at least 2 characters long',
        'string.max': 'Category name cannot exceed 50 characters'
    }),
    description: Joi.string().min(10).max(500).messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 500 characters'
    })
});

module.exports = {
    createCategorySchema,
    updateCategorySchema
};
