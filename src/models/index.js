import sequelize from '../config/db.js';
import User from './user.model.js';
import Profile from './profile.model.js';
import Event from './event.model.js';
import EventDraft from './event-draft.model.js';
import Application from './application.model.js';
import Chat from './chat.model.js';
import Notification from './notification.model.js';
import Experience from './experience.model.js';
import SavedEvent from './saved-event.model.js';

// ========== RELATIONSHIPS ==========

// User - Profile (One-to-One)
User.hasOne(Profile, { foreignKey: 'user_id', as: 'profile', onDelete: 'CASCADE' });
Profile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - Event (One-to-Many)
User.hasMany(Event, { foreignKey: 'created_by', as: 'events', onDelete: 'CASCADE' });
Event.belongsTo(User, { foreignKey: 'created_by', as: 'organizer' });

// User - EventDraft (One-to-Many)
User.hasMany(EventDraft, { foreignKey: 'created_by', as: 'eventDrafts', onDelete: 'CASCADE' });
EventDraft.belongsTo(User, { foreignKey: 'created_by', as: 'organizer' });

// User - Application (One-to-Many)
User.hasMany(Application, { foreignKey: 'student_id', as: 'applications', onDelete: 'CASCADE' });
Application.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// Event - Application (One-to-Many)
Event.hasMany(Application, { foreignKey: 'event_id', as: 'applications', onDelete: 'CASCADE' });
Application.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// User - Notification (One-to-Many)
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - Experience (One-to-Many)
User.hasMany(Experience, { foreignKey: 'user_id', as: 'experiences', onDelete: 'CASCADE' });
Experience.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - SavedEvent (One-to-Many)
User.hasMany(SavedEvent, { foreignKey: 'user_id', as: 'savedEvents', onDelete: 'CASCADE' });
SavedEvent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Event - SavedEvent (One-to-Many)
Event.hasMany(SavedEvent, { foreignKey: 'event_id', as: 'savedByUsers', onDelete: 'CASCADE' });
SavedEvent.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Chat - User (sender and receiver)
Chat.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Chat.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });
Chat.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Export all models
export {
  sequelize,
  User,
  Profile,
  Event,
  EventDraft,
  Application,
  Chat,
  Notification,
  Experience,
  SavedEvent
};
