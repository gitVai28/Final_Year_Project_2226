import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/index.js';
import { errorResponse } from '../utils/response.js';

/**
 * Authenticate JWT Token
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return errorResponse(res, 'Invalid or expired token.', 401);
    }

    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'otp', 'otp_expiry'] }
    });

    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    // Check if user is verified
    if (!user.is_verified) {
      return errorResponse(res, 'Please verify your email first.', 403);
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return errorResponse(res, `Account is ${user.status.toLowerCase()}. Please contact support.`, 403);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return errorResponse(res, 'Authentication failed.', 401);
  }
};

/**
 * Check if user is admin
 */
export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'COLLEGE_ADMIN') {
    return errorResponse(res, 'Access denied. Admin only.', 403);
  }
  next();
};

/**
 * Check if user is student
 */
export const isStudent = (req, res, next) => {
  if (req.user.role !== 'STUDENT') {
    return errorResponse(res, 'Access denied. Students only.', 403);
  }
  next();
};

export default { authenticate, isAdmin, isStudent };
