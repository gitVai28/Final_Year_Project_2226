import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './src/routes/auth.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import eventRoutes from './src/routes/event.routes.js';
import eventDraftRoutes from './src/routes/event-draft.routes.js';
import applicationRoutes from './src/routes/application.routes.js';
import studentRoutes from './src/routes/student.routes.js';
import profileRoutes from './src/routes/profile.routes.js';
import notificationRoutes from './src/routes/notification.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import chatRoutes from './src/routes/chat.routes.js';
import communityRoutes from './src/routes/community.routes.js';

// Import middleware
import { errorHandler, notFound } from './src/middleware/error.middleware.js';

dotenv.config();

const app = express();

// ========== MIDDLEWARE ==========

// CORS Configuration
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests, direct file previews, and common local preview ports.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    try {
      const { hostname } = new URL(origin);
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return callback(null, true);
      }
    } catch (error) {
      return callback(new Error('Invalid origin'));
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/tools', express.static(path.resolve('public')));

// Serve uploaded community files
app.use('/uploads', express.static(path.resolve('uploads')));

// Request Logger (Development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ========== ROUTES ==========

// Health Check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎓 CampusConnect API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/event-drafts', eventDraftRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/communities', communityRoutes);

// ========== ERROR HANDLING ==========

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

export default app;
