import { Op } from 'sequelize';
import { Chat, Event, Application, User } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { notifyNewMessage } from '../services/notification.service.js';

const CHAT_ELIGIBLE_STATUSES = ['PENDING', 'SHORTLISTED', 'SELECTED', 'COMPLETED'];

const resolveChatPermission = async (currentUserId, otherUserId, eventId) => {
  const event = await Event.findByPk(eventId, {
    attributes: ['id', 'created_by', 'title']
  });

  if (!event) {
    return { allowed: false, code: 404, message: 'Event not found' };
  }

  const isCurrentUserOrganizer = event.created_by === currentUserId;
  const isOtherUserOrganizer = event.created_by === otherUserId;

  if (isCurrentUserOrganizer === isOtherUserOrganizer) {
    return {
      allowed: false,
      code: 403,
      message: 'Chat is only allowed between event organizer and applicants'
    };
  }

  const applicantId = isCurrentUserOrganizer ? otherUserId : currentUserId;

  const application = await Application.findOne({
    where: {
      student_id: applicantId,
      event_id: eventId,
      status: { [Op.in]: CHAT_ELIGIBLE_STATUSES }
    },
    attributes: ['id', 'status']
  });

  if (!application) {
    return {
      allowed: false,
      code: 403,
      message: 'Chat is only allowed with users who applied for this event'
    };
  }

  return {
    allowed: true,
    event
  };
};

/**
 * GET /api/chats/conversations
 * List event-scoped chat counterparts for current user
 */
export const getMyConversations = async (req, res, next) => {
  try {
    const conversations = await Chat.findAll({
      where: {
        [Op.or]: [
          { sender_id: req.user.id },
          { receiver_id: req.user.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'full_name']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'full_name']
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'event_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const uniqueConversations = [];
    const seenKeys = new Set();

    for (const row of conversations) {
      const otherUser = row.sender_id === req.user.id ? row.receiver : row.sender;
      const key = `${row.event_id}:${otherUser.id}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      uniqueConversations.push({
        event: row.event,
        other_user: otherUser,
        last_message: {
          id: row.id,
          sender_id: row.sender_id,
          receiver_id: row.receiver_id,
          message: row.message,
          created_at: row.created_at
        }
      });
    }

    return successResponse(res, { conversations: uniqueConversations }, 'Conversations fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chats/history?event_id=&other_user_id=
 */
export const getChatHistory = async (req, res, next) => {
  try {
    const { event_id, other_user_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    if (!event_id || !other_user_id) {
      return errorResponse(res, 'event_id and other_user_id are required', 400);
    }

    const permission = await resolveChatPermission(req.user.id, other_user_id, event_id);
    if (!permission.allowed) {
      return errorResponse(res, permission.message, permission.code);
    }

    const { count, rows } = await Chat.findAndCountAll({
      where: {
        event_id,
        [Op.or]: [
          { sender_id: req.user.id, receiver_id: other_user_id },
          { sender_id: other_user_id, receiver_id: req.user.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'full_name']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'full_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    });

    return successResponse(res, {
      messages: rows.reverse(),
      pagination: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / Number(limit))
      }
    }, 'Chat history fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chats/message
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { receiver_id, event_id, message } = req.body;

    if (!receiver_id || !event_id || !message?.trim()) {
      return errorResponse(res, 'receiver_id, event_id and message are required', 400);
    }

    if (receiver_id === req.user.id) {
      return errorResponse(res, 'Cannot send message to yourself', 400);
    }

    const permission = await resolveChatPermission(req.user.id, receiver_id, event_id);
    if (!permission.allowed) {
      return errorResponse(res, permission.message, permission.code);
    }

    const created = await Chat.create({
      sender_id: req.user.id,
      receiver_id,
      event_id,
      message: message.trim()
    });

    const chat = await Chat.findByPk(created.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'full_name']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'full_name']
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'event_name']
        }
      ]
    });

    const io = req.app.get('io');
    if (io) {
      io.to(receiver_id).emit('receive_message', chat);
    }

    await notifyNewMessage(receiver_id, req.user.full_name, permission.event.title, io);

    return successResponse(res, { message: chat }, 'Message sent successfully', 201);
  } catch (error) {
    next(error);
  }
};

export default {
  getMyConversations,
  getChatHistory,
  sendMessage
};
