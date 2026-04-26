import Joi from 'joi';

/**
 * Create Application Validation Schema
 */
export const createApplicationSchema = Joi.object({
  event_id: Joi.string().uuid().required().messages({
    'string.empty': 'Event ID is required',
    'string.guid': 'Invalid event ID format'
  }),
  message: Joi.string().min(10).max(1000).optional().messages({
    'string.min': 'Message must be at least 10 characters',
    'string.max': 'Message must not exceed 1000 characters'
  })
});

/**
 * Update Application Status Schema
 */
export const updateApplicationStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'COMPLETED').required().messages({
    'any.only': 'Status must be one of: PENDING, SHORTLISTED, SELECTED, REJECTED, COMPLETED'
  })
});

export default {
  createApplicationSchema,
  updateApplicationStatusSchema
};
