import express from 'express';
import {
  createApplication,
  getEventApplications,
  getMyApplications,
  updateApplicationStatus,
  getApplicationById
} from '../controllers/application.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createApplicationSchema,
  updateApplicationStatusSchema
} from '../validations/application.validation.js';

const router = express.Router();

// All application routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/applications
 * @desc    Create new application
 * @access  Private (Students)
 */
router.post('/', validate(createApplicationSchema), createApplication);

/**
 * @route   GET /api/applications/my-applications
 * @desc    Get user's own applications
 * @access  Private
 */
router.get('/my-applications', getMyApplications);

/**
 * @route   GET /api/applications/:id
 * @desc    Get single application
 * @access  Private (Student or Organizer)
 */
router.get('/:id', getApplicationById);

/**
 * @route   PATCH /api/applications/:id/status
 * @desc    Update application status
 * @access  Private (Organizer only)
 */
router.patch('/:id/status', validate(updateApplicationStatusSchema), updateApplicationStatus);

export default router;

// Note: Event-specific applications route is in event.routes.js
// GET /api/events/:eventId/applications
