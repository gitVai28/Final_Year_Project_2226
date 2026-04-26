import Joi from 'joi';

/**
 * Register Validation Schema
 */
export const registerSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Full name must be at least 2 characters',
    'string.max': 'Full name must not exceed 100 characters'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters'
  }),
  role: Joi.string().valid('STUDENT', 'COLLEGE_ADMIN').default('STUDENT')
});

/**
 * Login Validation Schema
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

/**
 * Verify Email Schema
 */
export const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required().messages({
    'string.empty': 'OTP is required',
    'string.length': 'OTP must be 6 digits'
  })
});

/**
 * Resend OTP Schema
 */
export const resendOTPSchema = Joi.object({
  email: Joi.string().email().required()
});

export default {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOTPSchema
};
