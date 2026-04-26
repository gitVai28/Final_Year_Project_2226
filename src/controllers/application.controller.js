import { Application, Event, User, Profile, Experience } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { notifyApplicationSubmitted, notifyApplicationStatusChange } from '../services/notification.service.js';

/**
 * Create new application
 * POST /api/applications
 */
export const createApplication = async (req, res, next) => {
  try {
    const { event_id, message } = req.body;
    const student_id = req.user.id;

    // Check if event exists and is approved
    const event = await Event.findOne({
      where: {
        id: event_id,
        approval_status: 'APPROVED'
      }
    });

    if (!event) {
      return errorResponse(res, 'Event not found or not yet approved', 404);
    }

    // Check if event is open
    if (event.status !== 'OPEN') {
      return errorResponse(res, 'Event is not accepting applications', 400);
    }

    // Check if deadline has passed
    if (new Date() > new Date(event.deadline)) {
      return errorResponse(res, 'Application deadline has passed', 400);
    }

    // Prevent applying to own event
    if (event.created_by === student_id) {
      return errorResponse(res, 'You cannot apply to your own event', 400);
    }

    // Check for duplicate application
    const existingApplication = await Application.findOne({
      where: {
        student_id,
        event_id
      }
    });

    if (existingApplication) {
      return errorResponse(res, 'You have already applied to this event', 409);
    }

    // Create application
    const application = await Application.create({
      student_id,
      event_id,
      message,
      status: 'PENDING'
    });

    // Notify organizer
    await notifyApplicationSubmitted(event.created_by, req.user.full_name, event.title);

    return successResponse(
      res,
      { application },
      'Application submitted successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get applications for an event (organizer only)
 * GET /api/events/:eventId/applications
 */
export const getEventApplications = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Check if event exists and user is the organizer
    const event = await Event.findByPk(eventId);

    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    if (event.created_by !== req.user.id) {
      return errorResponse(res, 'You are not authorized to view these applications', 403);
    }

    const whereClause = { event_id: eventId };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: applications } = await Application.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'full_name', 'email'],
          include: [
            {
              model: Profile,
              as: 'profile'
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return successResponse(res, {
      applications,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's own applications
 * GET /api/applications/my-applications
 */
export const getMyApplications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { student_id: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: applications } = await Application.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Event,
          as: 'event',
          include: [
            {
              model: User,
              as: 'organizer',
              attributes: ['id', 'full_name', 'email']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return successResponse(res, {
      applications,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update application status (organizer only)
 * PATCH /api/applications/:id/status
 */
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const application = await Application.findByPk(id, {
      include: [
        {
          model: Event,
          as: 'event'
        },
        {
          model: User,
          as: 'student'
        }
      ]
    });

    if (!application) {
      return errorResponse(res, 'Application not found', 404);
    }

    // Check if user is the event organizer
    if (application.event.created_by !== req.user.id) {
      return errorResponse(res, 'Only event organizer can update application status', 403);
    }

    // Update status
    application.status = status;
    await application.save();

    // If status is COMPLETED, add experience to student's profile
    if (status === 'COMPLETED') {
      await Experience.create({
        user_id: application.student_id,
        title: application.event.title,
        event_name: application.event.event_name,
        category: application.event.category,
        completed_at: new Date()
      });
    }

    // Notify student
    await notifyApplicationStatusChange(
      application.student_id,
      application.event.title,
      status
    );

    return successResponse(res, { application }, 'Application status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get single application
 * GET /api/applications/:id
 */
export const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const application = await Application.findByPk(id, {
      include: [
        {
          model: Event,
          as: 'event',
          include: [
            {
              model: User,
              as: 'organizer',
              attributes: ['id', 'full_name', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'student',
          attributes: ['id', 'full_name', 'email'],
          include: [
            {
              model: Profile,
              as: 'profile'
            }
          ]
        }
      ]
    });

    if (!application) {
      return errorResponse(res, 'Application not found', 404);
    }

    // Check authorization (student or organizer)
    const isStudent = application.student_id === req.user.id;
    const isOrganizer = application.event.created_by === req.user.id;

    if (!isStudent && !isOrganizer) {
      return errorResponse(res, 'You are not authorized to view this application', 403);
    }

    return successResponse(res, { application });
  } catch (error) {
    next(error);
  }
};

export default {
  createApplication,
  getEventApplications,
  getMyApplications,
  updateApplicationStatus,
  getApplicationById
};
