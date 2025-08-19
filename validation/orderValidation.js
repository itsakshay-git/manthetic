const Joi = require('joi');

// Create order validation schema
const createOrderSchema = Joi.object({
    address_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Address ID must be a number',
        'number.integer': 'Address ID must be an integer',
        'number.positive': 'Address ID must be positive',
        'any.required': 'Address ID is required'
    }),
    payment_method: Joi.string().valid('CASH_ON_DELIVERY', 'ONLINE_PAYMENT', 'cod', 'online').required().messages({
        'any.only': 'Payment method must be either CASH_ON_DELIVERY, ONLINE_PAYMENT, cod, or online',
        'any.required': 'Payment method is required'
    })
});

// Update order status validation schema
const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED').required().messages({
        'any.only': 'Status must be one of: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED',
        'any.required': 'Status is required'
    }),
    payment_status: Joi.string().valid('PENDING', 'PAID', 'FAILED').optional().messages({
        'any.only': 'Payment status must be one of: PENDING, PAID, FAILED'
    })
});

module.exports = {
    createOrderSchema,
    updateOrderStatusSchema
};
