const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Collect all errors
            stripUnknown: true  // Remove unknown fields
        });

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errorMessage
            });
        }

        // Replace req.body with validated data
        req.body = value;
        next();
    };
};

module.exports = {
    validateRequest
};
