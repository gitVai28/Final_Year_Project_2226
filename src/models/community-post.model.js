import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CommunityPost = sequelize.define('CommunityPost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  community_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'communities',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('NOTES', 'PYQ', 'ASSIGNMENT'),
    allowNull: false
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  file_size: {
    type: DataTypes.INTEGER, // bytes
    allowNull: true
  },
  file_type: {
    type: DataTypes.STRING, // mime type
    allowNull: true
  }
}, {
  tableName: 'community_posts',
  timestamps: true,
  underscored: true
});

export default CommunityPost;
