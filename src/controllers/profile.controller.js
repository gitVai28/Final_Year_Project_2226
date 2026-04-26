import { Profile, User, Experience } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get current user's profile
 * GET /api/profile
 */
export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({
      where: { user_id: req.user.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email', 'role', 'status']
        }
      ]
    });

    if (!profile) {
      return errorResponse(res, 'Profile not found', 404);
    }

    // Get experiences
    const experiences = await Experience.findAll({
      where: { user_id: req.user.id },
      order: [['completed_at', 'DESC']]
    });

    return successResponse(res, {
      profile,
      experiences
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user's profile
 * PUT /api/profile
 */
export const updateMyProfile = async (req, res, next) => {
  try {
    const {
      bio,
      department,
      year,
      profile_picture,
      skills,
      interests
    } = req.body;

    let profile = await Profile.findOne({
      where: { user_id: req.user.id }
    });

    if (!profile) {
      // Create profile if doesn't exist
      profile = await Profile.create({
        user_id: req.user.id,
        bio,
        department,
        year,
        profile_picture,
        skills,
        interests
      });
    } else {
      // Update existing profile
      await profile.update({
        bio,
        department,
        year,
        profile_picture,
        skills,
        interests
      });
    }

    return successResponse(res, { profile }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's experiences
 * GET /api/profile/experiences
 */
export const getMyExperiences = async (req, res, next) => {
  try {
    const experiences = await Experience.findAll({
      where: { user_id: req.user.id },
      order: [['completed_at', 'DESC']]
    });

    return successResponse(res, { experiences });
  } catch (error) {
    next(error);
  }
};

export default {
  getMyProfile,
  updateMyProfile,
  getMyExperiences
};
