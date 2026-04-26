import Joi from 'joi';

/**
 * Create Event Validation Schema
 */
export const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title must not exceed 200 characters'
  }),
  description: Joi.string().min(10).required().messages({
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 10 characters'
  }),
  event_name: Joi.string().min(3).max(200).required().messages({
    'string.empty': 'Event name is required'
  }),
  required_skills: Joi.array().items(Joi.string()).default([]),
  category: Joi.string().valid('TECH', 'CULTURAL', 'SPORTS').required().messages({
    'any.only': 'Category must be one of: TECH, CULTURAL, SPORTS'
  }),
  number_of_positions: Joi.number().integer().min(1).required().messages({
    'number.base': 'Number of positions must be a number',
    'number.min': 'Number of positions must be at least 1'
  }),
  deadline: Joi.date().greater('now').required().messages({
    'date.greater': 'Deadline must be in the future'
  })
});

/**
 * Update Event Validation Schema
 */
export const updateEventSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  description: Joi.string().min(10),
  event_name: Joi.string().min(3).max(200),
  required_skills: Joi.array().items(Joi.string()),
  category: Joi.string().valid('TECH', 'CULTURAL', 'SPORTS'),
  number_of_positions: Joi.number().integer().min(1),
  deadline: Joi.date().greater('now'),
  status: Joi.string().valid('OPEN', 'CLOSED', 'COMPLETED')
}).min(1);

/**
 * Bulk Email Schema
 */
export const bulkEmailSchema = Joi.object({
  subject: Joi.string().min(3).max(200).required(),
  message: Joi.string().min(10).required(),
  target: Joi.string().valid('ALL', 'SHORTLISTED').default('ALL')
});

export default {
  createEventSchema,
  updateEventSchema,
  bulkEmailSchema
};
