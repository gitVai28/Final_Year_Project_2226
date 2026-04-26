import { Event, User, Application, Profile } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { sendBulkEmail } from '../services/email.service.js';
import { Op } from 'sequelize';

/**
 * Create new event
 * POST /api/events
 */
export const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      event_name,
      required_skills,
      category,
      number_of_positions,
      deadline
    } = req.body;

    const event = await Event.create({
      title,
      description,
      event_name,
      required_skills,
      category,
      number_of_positions,
      deadline,
      created_by: req.user.id,
      status: 'OPEN',
      approval_status: 'PENDING_REVIEW' // Requires admin approval
    });

    return successResponse(
      res,
      { event },
      'Event created successfully. Waiting for admin approval.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all approved events (public)
 * GET /api/events
 */
export const getAllEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, status, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      approval_status: 'APPROVED' // Only show approved events
    };

    if (category) {
      whereClause.category = category;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { event_name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: events } = await Event.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'full_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return successResponse(res, {
      events,
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
 * Get single event by ID
 * GET /api/events/:id
 */
export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findOne({
      where: {
        id,
        approval_status: 'APPROVED' // Only show if approved
      },
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'full_name', 'email']
        }
      ]
    });

    if (!event) {
      return errorResponse(res, 'Event not found or not yet approved', 404);
    }

    return successResponse(res, { event });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's own events (including pending/rejected)
 * GET /api/events/my-events
 */
export const getMyEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: events } = await Event.findAndCountAll({
      where: { created_by: req.user.id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return successResponse(res, {
      events,
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
 * Update event
 * PUT /api/events/:id
 */
export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);

    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    // Check ownership
    if (event.created_by !== req.user.id) {
      return errorResponse(res, 'You are not authorized to update this event', 403);
    }

    // Update event
    await event.update(req.body);

    return successResponse(res, { event }, 'Event updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete event
 * DELETE /api/events/:id
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);

    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    // Check ownership
    if (event.created_by !== req.user.id) {
      return errorResponse(res, 'You are not authorized to delete this event', 403);
    }

    await event.destroy();

    return successResponse(res, null, 'Event deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Send bulk email to applicants
 * POST /api/events/:id/email-applicants
 */
export const emailApplicants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, message, target } = req.body; // target: 'ALL' or 'SHORTLISTED'

    const event = await Event.findByPk(id);

    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    // Check ownership
    if (event.created_by !== req.user.id) {
      return errorResponse(res, 'Only event organizer can send emails', 403);
    }

    // Build where clause based on target
    const whereClause = { event_id: id };
    
    if (target === 'SHORTLISTED') {
      whereClause.status = { [Op.in]: ['SHORTLISTED', 'SELECTED'] };
    }

    // Get applicants
    const applications = await Application.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'full_name', 'email']
        }
      ]
    });

    if (applications.length === 0) {
      return errorResponse(res, 'No applicants found', 404);
    }

    // Prepare recipient list
    const recipients = applications.map(app => ({
      email: app.student.email,
      full_name: app.student.full_name
    }));

    // Send bulk email
    const result = await sendBulkEmail(recipients, subject, message, event.event_name);

    if (!result.success) {
      return errorResponse(res, 'Failed to send emails', 500);
    }

    return successResponse(
      res,
      { sent_to: result.count },
      `Email sent successfully to ${result.count} applicants`
    );
  } catch (error) {
    next(error);
  }
};

export default {
  createEvent,
  getAllEvents,
  getEventById,
  getMyEvents,
  updateEvent,
  deleteEvent,
  emailApplicants
};
