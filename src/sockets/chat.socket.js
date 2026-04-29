import { Chat, Application, User, Event } from '../models/index.js';
import { verifyToken } from '../utils/jwt.js';
import { notifyNewMessage } from '../services/notification.service.js';
import { Op } from 'sequelize';

const CHAT_ELIGIBLE_STATUSES = ['PENDING', 'SHORTLISTED', 'SELECTED', 'COMPLETED'];

const canUsersChatForEvent = async (senderId, receiverId, eventId) => {
  const event = await Event.findByPk(eventId, {
    attributes: ['id', 'title', 'created_by']
  });

  if (!event) {
    return { allowed: false, message: 'Event not found' };
  }

  const senderIsOrganizer = event.created_by === senderId;
  const receiverIsOrganizer = event.created_by === receiverId;

  if (senderIsOrganizer === receiverIsOrganizer) {
    return { allowed: false, message: 'Chat is only allowed between organizer and applicants' };
  }

  const applicantId = senderIsOrganizer ? receiverId : senderId;

  const application = await Application.findOne({
    where: {
      student_id: applicantId,
      event_id: eventId,
      status: {
        [Op.in]: CHAT_ELIGIBLE_STATUSES
      }
    },
    attributes: ['id']
  });

  if (!application) {
    return { allowed: false, message: 'No eligible application found for this event' };
  }

  return { allowed: true, eventTitle: event.title };
};

/**
 * Setup Socket.IO for real-time chat
 */
export const setupSocket = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyToken(token);
      
      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      // Get user from database
      const user = await User.findByPk(decoded.id);
      
      if (!user || !user.is_verified || user.status !== 'ACTIVE') {
        return next(new Error('User not authorized'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      socket.userName = user.full_name;
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userName} (${socket.userId})`);

    // Join user to their own room
    socket.join(socket.userId);

    /**
     * Send Message Event
     * Validates chat eligibility before sending
     */
    socket.on('send_message', async (data) => {
      try {
        const { receiver_id, event_id, message } = data;

        if (!receiver_id || !event_id || !message) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }

        if (receiver_id === socket.userId) {
          socket.emit('error', { message: 'Cannot send message to yourself' });
          return;
        }

        const permission = await canUsersChatForEvent(socket.userId, receiver_id, event_id);
        if (!permission.allowed) {
          socket.emit('error', {
            message: permission.message
          });
          return;
        }

        // Save message to database
        const chat = await Chat.create({
          sender_id: socket.userId,
          receiver_id,
          event_id,
          message
        });

        // Populate sender info for response
        const chatWithSender = await Chat.findByPk(chat.id, {
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
          ]
        });

        // Send message to receiver's room
        io.to(receiver_id).emit('receive_message', chatWithSender);

        // Send confirmation to sender
        socket.emit('message_sent', chatWithSender);

        // Create notification for receiver
        await notifyNewMessage(receiver_id, socket.userName, permission.eventTitle, io);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Typing Indicator Event
     */
    socket.on('typing', (data) => {
      const { receiver_id, event_id, is_typing } = data;
      
      io.to(receiver_id).emit('user_typing', {
        sender_id: socket.userId,
        sender_name: socket.userName,
        event_id,
        is_typing
      });
    });

    /**
     * Get Chat History Event
     */
    socket.on('get_chat_history', async (data) => {
      try {
        const { other_user_id, event_id, page = 1, limit = 50 } = data;
        const offset = (page - 1) * limit;

        const permission = await canUsersChatForEvent(socket.userId, other_user_id, event_id);
        if (!permission.allowed) {
          socket.emit('error', { message: permission.message });
          return;
        }

        const messages = await Chat.findAll({
          where: {
            event_id,
            [Op.or]: [
              { sender_id: socket.userId, receiver_id: other_user_id },
              { sender_id: other_user_id, receiver_id: socket.userId }
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
          limit,
          offset
        });

        socket.emit('chat_history', {
          messages: messages.reverse(), // Send in chronological order
          page,
          has_more: messages.length === limit
        });

      } catch (error) {
        console.error('Get chat history error:', error);
        socket.emit('error', { message: 'Failed to fetch chat history' });
      }
    });

    /**
     * Disconnect Event
     */
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userName} (${socket.userId})`);
    });
  });

  console.log('✅ Socket.IO setup complete');
};

export default setupSocket;
