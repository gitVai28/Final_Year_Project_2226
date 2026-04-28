import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  event_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'COMPLETED'),
    defaultValue: 'PENDING',
    allowNull: false
  }
}, {
  tableName: 'applications',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'event_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['student_id']
    },
    {
      fields: ['event_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

export default Application;
