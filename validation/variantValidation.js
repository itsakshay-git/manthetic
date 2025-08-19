const Joi = require('joi');

// Create variant validation schema
const createVariantSchema = Joi.object({
    product_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be positive',
        'any.required': 'Product ID is required'
    }),
    name: Joi.string().min(2).max(100).required().messages({
        'string.min': 'Variant name must be at least 2 characters long',
        'string.max': 'Variant name cannot exceed 100 characters',
        'any.required': 'Variant name is required'
    }),
    description: Joi.string().min(10).max(1000).required().messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 1000 characters',
        'any.required': 'Description is required'
    }),
    images: Joi.array().items(Joi.string().uri()).default([]).messages({
        'array.base': 'Images must be an array',
        'string.uri': 'Each image must be a valid URL'
    }),
    is_best_selling: Joi.boolean().default(false).messages({
        'boolean.base': 'is_best_selling must be a boolean'
    }),
    size_options: Joi.alternatives().try(
        Joi.string().custom((value, helpers) => {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
                return helpers.error('any.invalid');
            } catch (error) {
                return helpers.error('any.invalid');
            }
        }, 'JSON string to array').messages({
            'any.invalid': 'Size options must be a valid JSON string representing an array'
        }),
        Joi.array().items(
            Joi.object({
                size: Joi.string().required().messages({
                    'any.required': 'Size is required in size options'
                }),
                price: Joi.alternatives().try(
                    Joi.string().pattern(/^\d+(\.\d+)?$/).messages({
                        'string.pattern.base': 'Price must be a valid number string'
                    }),
                    Joi.number().positive().messages({
                        'number.positive': 'Price must be positive'
                    })
                ).required().messages({
                    'any.required': 'Price is required in size options'
                }),
                stock: Joi.alternatives().try(
                    Joi.string().pattern(/^\d+$/).messages({
                        'string.pattern.base': 'Stock must be a valid integer string'
                    }),
                    Joi.number().integer().min(0).messages({
                        'number.integer': 'Stock must be an integer',
                        'number.min': 'Stock cannot be negative'
                    })
                ).required().messages({
                    'any.required': 'Stock is required in size options'
                })
            })
        )
    ).default([]).messages({
        'alternatives.any': 'Size options must be either a JSON string or an array'
    })
});

// Update variant validation schema
const updateVariantSchema = Joi.object({
    name: Joi.string().min(2).max(100).messages({
        'string.min': 'Variant name must be at least 2 characters long',
        'string.max': 'Variant name cannot exceed 100 characters'
    }),
    description: Joi.string().min(10).max(1000).messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 1000 characters'
    }),
    images: Joi.array().items(Joi.string().uri()).messages({
        'array.base': 'Images must be an array',
        'string.uri': 'Each image must be a valid URL'
    }),
    is_best_selling: Joi.boolean().messages({
        'boolean.base': 'is_best_selling must be a boolean'
    }),
    size_options: Joi.alternatives().try(
        Joi.string().custom((value, helpers) => {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
                return helpers.error('any.invalid');
            } catch (error) {
                return helpers.error('any.invalid');
            }
        }, 'JSON string to array').messages({
            'any.invalid': 'Size options must be a valid JSON string representing an array'
        }),
        Joi.array().items(
            Joi.object({
                size: Joi.string().required(),
                price: Joi.alternatives().try(
                    Joi.string().pattern(/^\d+(\.\d+)?$/),
                    Joi.number().positive()
                ).required(),
                stock: Joi.alternatives().try(
                    Joi.string().pattern(/^\d+$/),
                    Joi.number().integer().min(0)
                ).required()
            })
        )
    ).messages({
        'alternatives.any': 'Size options must be either a JSON string or an array'
    })
});

module.exports = {
    createVariantSchema,
    updateVariantSchema
};
