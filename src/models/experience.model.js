import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Experience = sequelize.define('Experience', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  event_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('TECH', 'CULTURAL', 'SPORTS'),
    allowNull: false
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'experiences',
  timestamps: true,
  underscored: true
});

export default Experience;
