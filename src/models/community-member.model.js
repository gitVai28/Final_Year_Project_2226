import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CommunityMember = sequelize.define('CommunityMember', {
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
  role: {
    type: DataTypes.ENUM('MEMBER', 'ADMIN'),
    defaultValue: 'MEMBER',
    allowNull: false
  }
}, {
  tableName: 'community_members',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'community_id'] // prevent duplicate memberships
    }
  ]
});

export default CommunityMember;
