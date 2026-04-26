import express from 'express';
import {
  getMyProfile,
  updateMyProfile,
  getMyExperiences
} from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateProfileSchema } from '../validations/profile.validation.js';

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/', getMyProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update user's profile
 * @access  Private
 */
router.put('/', validate(updateProfileSchema), updateMyProfile);

/**
 * @route   GET /api/profile/experiences
 * @desc    Get user's experiences
 * @access  Private
 */
router.get('/experiences', getMyExperiences);

export default router;
