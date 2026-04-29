import { Notification } from '../models/index.js';

/**
 * Create a notification for a user
 */
export const createNotification = async (userId, message) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      message,
      is_read: false
    });
    return { success: true, notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false };
  }
};

/**
 * Notify on application submission
 */
export const notifyApplicationSubmitted = async (organizerId, studentName, eventTitle) => {
  const message = `${studentName} has applied for your event "${eventTitle}".`;
  await createNotification(organizerId, message);
};

/**
 * Notify on application status change
 */
export const notifyApplicationStatusChange = async (studentId, eventTitle, status) => {
  let message = '';
  
  switch(status) {
    case 'SHORTLISTED':
      message = `Congratulations! You have been shortlisted for "${eventTitle}".`;
      break;
    case 'SELECTED':
      message = `Congratulations! You have been selected for "${eventTitle}".`;
      break;
    case 'REJECTED':
      message = `Thank you for applying to "${eventTitle}". Unfortunately, you were not selected this time.`;
      break;
    case 'COMPLETED':
      message = `You have successfully completed the event "${eventTitle}". Experience has been added to your profile!`;
      break;
  }
  
  if (message) {
    await createNotification(studentId, message);
  }
};

/**
 * Notify on event approval/rejection
 */
export const notifyEventStatus = async (organizerId, eventTitle, approvalStatus) => {
  let message = '';
  
  if (approvalStatus === 'APPROVED') {
    message = `Your event "${eventTitle}" has been approved and is now visible to students!`;
  } else if (approvalStatus === 'REJECTED') {
    message = `Your event "${eventTitle}" has been rejected by the admin.`;
  }
  
  if (message) {
    await createNotification(organizerId, message);
  }
};

/**
 * Notify on new message
 */
export const notifyNewMessage = async (receiverId, senderName, eventTitle = null, io = null) => {
  const message = eventTitle
    ? `You have a new message from ${senderName} about "${eventTitle}".`
    : `You have a new message from ${senderName}.`;

  const result = await createNotification(receiverId, message);

  if (io && result.success) {
    io.to(receiverId).emit('notification_received', result.notification);
  }
};

export default {
  createNotification,
  notifyApplicationSubmitted,
  notifyApplicationStatusChange,
  notifyEventStatus,
  notifyNewMessage
};
