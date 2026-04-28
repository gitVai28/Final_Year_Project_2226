import express from 'express';
import {
  getDashboardSummary,
  getDepartmentWiseAnalytics,
  getYearWiseAnalytics,
  getEventWiseAnalytics,
  getParticipationTrends,
  getSmartInsights,
  getDashboardDetails
} from '../controllers/dashboard.controller.js';
import { authenticate, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', getDashboardSummary);
router.get('/department-wise', getDepartmentWiseAnalytics);
router.get('/year-wise', getYearWiseAnalytics);
router.get('/event-wise', getEventWiseAnalytics);
router.get('/trends', getParticipationTrends);
router.get('/insights', getSmartInsights);

// Admin-only drill down with student-level details
router.get('/details', isAdmin, getDashboardDetails);

export default router;
