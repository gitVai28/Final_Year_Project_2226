import Joi from 'joi';

/**
 * Update Profile Validation Schema
 */
export const updateProfileSchema = Joi.object({
  bio: Joi.string().max(500).optional(),
  department: Joi.string().max(100).optional(),
  year: Joi.number().integer().min(1).max(5).optional().messages({
    'number.min': 'Year must be between 1 and 5',
    'number.max': 'Year must be between 1 and 5'
  }),
  profile_picture: Joi.string().uri().optional(),
  skills: Joi.array().items(Joi.string()).optional(),
  interests: Joi.array().items(Joi.string()).optional()
}).min(1);

export default {
  updateProfileSchema
};
