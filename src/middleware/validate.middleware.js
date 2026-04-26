import { errorResponse } from '../utils/response.js';

/**
 * Validation Middleware Factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return errorResponse(res, 'Validation failed', 400, errors);
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

export default validate;
