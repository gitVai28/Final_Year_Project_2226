import { User, Profile } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { sendOTPEmail } from '../services/email.service.js';

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { full_name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 409);
    }

    // Create user
    const user = await User.create({
      full_name,
      email,
      password, // Will be hashed by beforeCreate hook
      role: role || 'STUDENT'
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Create empty profile for the user
    await Profile.create({
      user_id: user.id
    });

    // Send OTP email
    await sendOTPEmail(email, full_name, otp);

    return successResponse(
      res,
      { email: user.email },
      'Registration successful. Please check your email for OTP verification.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email with OTP
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.is_verified) {
      return errorResponse(res, 'Email already verified', 400);
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return errorResponse(res, 'Invalid or expired OTP', 400);
    }

    // Update user as verified
    user.is_verified = true;
    user.otp = null;
    user.otp_expiry = null;
    await user.save();

    return successResponse(res, null, 'Email verified successfully. You can now login.');
  } catch (error) {
    next(error);
  }
};

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.is_verified) {
      return errorResponse(res, 'Email already verified', 400);
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, user.full_name, otp);

    return successResponse(res, null, 'OTP sent successfully to your email.');
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Check if verified
    if (!user.is_verified) {
      return errorResponse(res, 'Please verify your email first', 403);
    }

    // Check if active
    if (user.status !== 'ACTIVE') {
      return errorResponse(res, `Account is ${user.status.toLowerCase()}. Please contact support.`, 403);
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    // Return user data with token
    return successResponse(res, {
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'otp', 'otp_expiry'] },
      include: [
        {
          model: Profile,
          as: 'profile'
        }
      ]
    });

    return successResponse(res, { user });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  verifyEmail,
  resendOTP,
  login,
  getMe
};
