import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const EventDraft = sequelize.define('EventDraft', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  event_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  required_skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  category: {
    type: DataTypes.ENUM('TECH', 'CULTURAL', 'SPORTS'),
    allowNull: true
  },
  number_of_positions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'event_drafts',
  timestamps: true,
  underscored: true
});

export default EventDraft;
