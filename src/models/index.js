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
import Community from './community.model.js';
import CommunityMember from './community-member.model.js';
import CommunityPost from './community-post.model.js';
import PostComment from './post-comment.model.js';
import PostLike from './post-like.model.js';

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

// ========== COMMUNITY RELATIONSHIPS ==========

// Community - User (creator)
User.hasMany(Community, { foreignKey: 'created_by', as: 'communities', onDelete: 'CASCADE' });
Community.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Community - CommunityMember (Many-to-Many through CommunityMember)
Community.hasMany(CommunityMember, { foreignKey: 'community_id', as: 'memberships', onDelete: 'CASCADE' });
CommunityMember.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });

User.hasMany(CommunityMember, { foreignKey: 'user_id', as: 'communityMemberships', onDelete: 'CASCADE' });
CommunityMember.belongsTo(User, { foreignKey: 'user_id', as: 'member' });

// Community - CommunityPost (One-to-Many)
Community.hasMany(CommunityPost, { foreignKey: 'community_id', as: 'posts', onDelete: 'CASCADE' });
CommunityPost.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });

// User - CommunityPost (One-to-Many)
User.hasMany(CommunityPost, { foreignKey: 'user_id', as: 'communityPosts', onDelete: 'CASCADE' });
CommunityPost.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// CommunityPost - PostComment (One-to-Many)
CommunityPost.hasMany(PostComment, { foreignKey: 'post_id', as: 'comments', onDelete: 'CASCADE' });
PostComment.belongsTo(CommunityPost, { foreignKey: 'post_id', as: 'post' });

// User - PostComment (One-to-Many)
User.hasMany(PostComment, { foreignKey: 'user_id', as: 'postComments', onDelete: 'CASCADE' });
PostComment.belongsTo(User, { foreignKey: 'user_id', as: 'commenter' });

// CommunityPost - PostLike (One-to-Many)
CommunityPost.hasMany(PostLike, { foreignKey: 'post_id', as: 'likes', onDelete: 'CASCADE' });
PostLike.belongsTo(CommunityPost, { foreignKey: 'post_id', as: 'post' });

// User - PostLike (One-to-Many)
User.hasMany(PostLike, { foreignKey: 'user_id', as: 'postLikes', onDelete: 'CASCADE' });
PostLike.belongsTo(User, { foreignKey: 'user_id', as: 'liker' });

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
  SavedEvent,
  Community,
  CommunityMember,
  CommunityPost,
  PostComment,
  PostLike
};
