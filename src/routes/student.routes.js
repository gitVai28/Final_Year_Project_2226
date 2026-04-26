import express from 'express';
import {
  searchStudents,
  getStudentById
} from '../controllers/student.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All student routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/students/search
 * @desc    Search students with filters
 * @access  Private
 */
router.get('/search', searchStudents);

/**
 * @route   GET /api/students/:id
 * @desc    Get student profile by ID
 * @access  Private
 */
router.get('/:id', getStudentById);

export default router;
