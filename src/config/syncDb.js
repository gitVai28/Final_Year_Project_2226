import { sequelize } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database Sync Script
 * Run this to create/update database tables
 */
const syncDatabase = async () => {
  try {
    console.log('🔄 Starting database synchronization...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync all models
    // alter: true - Will modify existing tables to match models
    // force: true - Will drop and recreate all tables (⚠️ DESTRUCTIVE)
    await sequelize.sync({ alter: true });
    
    console.log('✅ Database synchronized successfully');
    console.log('📋 All tables have been created/updated');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    process.exit(1);
  }
};

syncDatabase();
