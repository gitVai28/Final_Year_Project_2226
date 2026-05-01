import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const PostLike = sequelize.define('PostLike', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  post_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'community_posts',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'post_likes',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['post_id', 'user_id'] // one like per user per post
    }
  ]
});

export default PostLike;
