import express from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  getMyEvents,
  updateEvent,
  deleteEvent,
  emailApplicants
} from '../controllers/event.controller.js';
import { getEventApplications } from '../controllers/application.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createEventSchema,
  updateEventSchema,
  bulkEmailSchema
} from '../validations/event.validation.js';

const router = express.Router();

/**
 * @route   GET /api/events
 * @desc    Get all approved events
 * @access  Public
 */
router.get('/', getAllEvents);

/**
 * @route   GET /api/events/my-events
 * @desc    Get user's own events
 * @access  Private
 */
router.get('/my-events', authenticate, getMyEvents);

/**
 * @route   GET /api/events/:id
 * @desc    Get single event by ID
 * @access  Public
 */
router.get('/:id', getEventById);

/**
 * @route   GET /api/events/:eventId/applications
 * @desc    Get applications for an event
 * @access  Private (Organizer only)
 */
router.get('/:eventId/applications', authenticate, getEventApplications);

/**
 * @route   POST /api/events
 * @desc    Create new event
 * @access  Private
 */
router.post('/', authenticate, validate(createEventSchema), createEvent);

/**
 * @route   PUT /api/events/:id
 * @desc    Update event
 * @access  Private (Owner only)
 */
router.put('/:id', authenticate, validate(updateEventSchema), updateEvent);

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event
 * @access  Private (Owner only)
 */
router.delete('/:id', authenticate, deleteEvent);

/**
 * @route   POST /api/events/:id/email-applicants
 * @desc    Send bulk email to applicants
 * @access  Private (Organizer only)
 */
router.post('/:id/email-applicants', authenticate, validate(bulkEmailSchema), emailApplicants);

export default router;
