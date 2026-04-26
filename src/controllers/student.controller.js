import { User, Profile } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { Op } from 'sequelize';

/**
 * Search students with advanced filters
 * GET /api/students/search
 */
export const searchStudents = async (req, res, next) => {
  try {
    const {
      skills,
      interests,
      department,
      year,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause for User
    const userWhere = {
      role: 'STUDENT',
      is_verified: true,
      status: 'ACTIVE'
    };

    // Build where clause for Profile
    const profileWhere = {};

    // Search by name or email
    if (search) {
      userWhere[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by skills (array overlap)
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      profileWhere.skills = {
        [Op.overlap]: skillsArray
      };
    }

    // Filter by interests (array overlap)
    if (interests) {
      const interestsArray = Array.isArray(interests) ? interests : [interests];
      profileWhere.interests = {
        [Op.overlap]: interestsArray
      };
    }

    // Filter by department (case-insensitive)
    if (department) {
      profileWhere.department = { [Op.iLike]: department };
    }

    // Filter by year
    if (year) {
      profileWhere.year = parseInt(year);
    }

    const { count, rows: students } = await User.findAndCountAll({
      where: userWhere,
      include: [
        {
          model: Profile,
          as: 'profile',
          where: Object.keys(profileWhere).length > 0 ? profileWhere : undefined,
          required: Object.keys(profileWhere).length > 0
        }
      ],
      attributes: ['id', 'full_name', 'email', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return successResponse(res, {
      students,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student profile by ID
 * GET /api/students/:id
 */
export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await User.findOne({
      where: {
        id,
        role: 'STUDENT'
      },
      attributes: ['id', 'full_name', 'email', 'created_at'],
      include: [
        {
          model: Profile,
          as: 'profile'
        }
      ]
    });

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    return successResponse(res, { student });
  } catch (error) {
    next(error);
  }
};

export default {
  searchStudents,
  getStudentById
};
