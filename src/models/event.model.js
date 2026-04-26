import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  event_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  required_skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  category: {
    type: DataTypes.ENUM('TECH', 'CULTURAL', 'SPORTS'),
    allowNull: false
  },
  number_of_positions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('OPEN', 'CLOSED', 'COMPLETED'),
    defaultValue: 'OPEN',
    allowNull: false
  },
  approval_status: {
    type: DataTypes.ENUM('PENDING_REVIEW', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING_REVIEW',
    allowNull: false
  }
}, {
  tableName: 'events',
  timestamps: true,
  underscored: true
});

export default Event;
