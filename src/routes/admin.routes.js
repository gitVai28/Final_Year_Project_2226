import express from 'express';
import {
  getPendingEvents,
  approveEvent,
  rejectEvent,
  getAllEvents,
  adminRegister,
  adminLogin
} from '../controllers/admin.controller.js';

import { authenticate, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// PUBLIC ROUTES (no auth)
router.post("/register", adminRegister);
router.post("/login", adminLogin);


router.get('/events/pending',authenticate,isAdmin, getPendingEvents);
router.get('/events',authenticate,isAdmin, getAllEvents);
router.patch('/events/:id/approve',authenticate,isAdmin, approveEvent);
router.patch('/events/:id/reject',authenticate,isAdmin, rejectEvent);

export default router;