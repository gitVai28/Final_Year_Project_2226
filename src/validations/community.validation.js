import Joi from 'joi';

/**
 * Create Community (Admin only)
 */
export const createCommunitySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Community name is required',
    'string.min': 'Community name must be at least 2 characters',
    'string.max': 'Community name must not exceed 100 characters'
  }),
  department: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Department is required'
  }),
  description: Joi.string().max(500).optional().allow('', null)
});

/**
 * Create Post (member only)
 * Note: file is handled by multer, not Joi
 */
export const createPostSchema = Joi.object({
  title: Joi.string().min(2).max(200).required().messages({
    'string.empty': 'Post title is required',
    'string.min': 'Title must be at least 2 characters',
    'string.max': 'Title must not exceed 200 characters'
  }),
  description: Joi.string().max(2000).optional().allow('', null),
  type: Joi.string().valid('NOTES', 'PYQ', 'ASSIGNMENT').required().messages({
    'any.only': 'Post type must be one of: NOTES, PYQ, ASSIGNMENT',
    'string.empty': 'Post type is required'
  })
});

/**
 * Add Comment
 */
export const addCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required().messages({
    'string.empty': 'Comment content is required',
    'string.max': 'Comment must not exceed 1000 characters'
  })
});
