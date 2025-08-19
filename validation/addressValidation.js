const Joi = require('joi');

// Create address validation schema
const createAddressSchema = Joi.object({
    user_id: Joi.number().integer().positive().required().messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive',
        'any.required': 'User ID is required'
    }),
    city: Joi.string().min(2).max(50).required().messages({
        'string.min': 'City must be at least 2 characters long',
        'string.max': 'City cannot exceed 50 characters',
        'any.required': 'City is required'
    }),
    zipcode: Joi.string().pattern(/^\d{5,6}$/).required().messages({
        'string.pattern.base': 'Zipcode must be 5-6 digits',
        'any.required': 'Zipcode is required'
    }),
    country: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Country must be at least 2 characters long',
        'string.max': 'Country cannot exceed 50 characters',
        'any.required': 'Country is required'
    }),
    state: Joi.string().min(2).max(50).required().messages({
        'string.min': 'State must be at least 2 characters long',
        'string.max': 'State cannot exceed 50 characters',
        'any.required': 'State is required'
    }),
    street: Joi.string().min(5).max(200).required().messages({
        'string.min': 'Street must be at least 5 characters long',
        'string.max': 'Street cannot exceed 200 characters',
        'any.required': 'Street is required'
    }),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,15}$/).required().messages({
        'string.pattern.base': 'Phone number must be 10-15 digits with optional formatting',
        'any.required': 'Phone number is required'
    })
});

// Update address validation schema
const updateAddressSchema = Joi.object({
    city: Joi.string().min(2).max(50).messages({
        'string.min': 'City must be at least 2 characters long',
        'string.max': 'City cannot exceed 50 characters'
    }),
    zipcode: Joi.string().pattern(/^\d{5,6}$/).messages({
        'string.pattern.base': 'Zipcode must be 5-6 digits'
    }),
    country: Joi.string().min(2).max(50).messages({
        'string.min': 'Country must be at least 2 characters long',
        'string.max': 'Country cannot exceed 50 characters'
    }),
    state: Joi.string().min(2).max(50).messages({
        'string.min': 'State must be at least 2 characters long',
        'string.max': 'State cannot exceed 50 characters'
    }),
    street: Joi.string().min(5).max(200).messages({
        'string.min': 'Street must be at least 5 characters long',
        'string.max': 'Street cannot exceed 200 characters'
    }),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,15}$/).messages({
        'string.pattern.base': 'Phone number must be 10-15 digits with optional formatting'
    })
});

module.exports = {
    createAddressSchema,
    updateAddressSchema
};
