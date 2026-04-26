import { Event, User } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { notifyEventStatus } from '../services/notification.service.js';
import { generateToken } from '../utils/jwt.js';



export const adminRegister = async (req, res) => {
  try {
    const { full_name, email, password, secret_key } = req.body;

    // 🔐 Security check
    if (secret_key !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ msg: "Invalid secret key" });
    }

    // check existing admin
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const admin = await User.create({
      full_name,
      email,
      password,
      role: "COLLEGE_ADMIN",
      is_verified: true,
      status: "ACTIVE"
    });

    res.status(201).json({
      msg: "Admin created successfully",
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/**
 * Admin Login (same as regular login but returns admin-specific data)
 * POST /api/admin/login
 */
export const adminLogin = async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password;

    const admin = await User.findOne({ where: { email } });

    if (!admin) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    if (admin.role !== 'COLLEGE_ADMIN') {
      return errorResponse(res, 'Access denied. Admin only.', 403);
    }

    if (admin.status !== 'ACTIVE') {
      return errorResponse(res, `Account is ${admin.status.toLowerCase()}. Please contact support.`, 403);
    }

    const match = await admin.comparePassword(password);

    if (!match) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const token = generateToken(admin.id, admin.role);

    return successResponse(res, {
      token,
      user: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role,
        status: admin.status
      }
    }, 'Admin login successful');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get all pending events (awaiting approval)
 * GET /api/admin/events/pending
 */
export const getPendingEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: events } = await Event.findAndCountAll({
      where: { approval_status: 'PENDING_REVIEW' },
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
 * Approve an event
 * PATCH /api/admin/events/:id/approve
 */
export const approveEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'full_name', 'email']
        }
      ]
    });

    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    if (event.approval_status !== 'PENDING_REVIEW') {
      return errorResponse(res, 'Event is not pending review', 400);
    }

    // Update approval status
    event.approval_status = 'APPROVED';
    await event.save();

    // Notify organizer
    await notifyEventStatus(event.created_by, event.title, 'APPROVED');

    return successResponse(res, { event }, 'Event approved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reject an event
 * PATCH /api/admin/events/:id/reject
 */
export const rejectEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Optional rejection reason

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'full_name', 'email']
        }
      ]
    });

    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    if (event.approval_status !== 'PENDING_REVIEW') {
      return errorResponse(res, 'Event is not pending review', 400);
    }

    // Update approval status
    event.approval_status = 'REJECTED';
    await event.save();

    // Notify organizer
    await notifyEventStatus(event.created_by, event.title, 'REJECTED');

    return successResponse(res, { event }, 'Event rejected');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all events (approved, pending, rejected)
 * GET /api/admin/events
 */
export const getAllEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, approval_status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (approval_status) {
      whereClause.approval_status = approval_status;
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

export default {
  adminLogin,
  getPendingEvents,
  approveEvent,
  rejectEvent,
  getAllEvents
};
