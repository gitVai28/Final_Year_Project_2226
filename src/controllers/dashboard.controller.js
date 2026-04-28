import Joi from 'joi';
import { QueryTypes } from 'sequelize';
import { Application, sequelize } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/response.js';

const CACHE_TTL_MS = 60 * 1000;
const dashboardCache = new Map();

const baseFilterSchema = Joi.object({
  department: Joi.string().trim().max(100).optional(),
  year: Joi.number().integer().min(1).max(5).optional(),
  event: Joi.string().uuid().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional()
});

const trendFilterSchema = baseFilterSchema.keys({
  interval: Joi.string().valid('day', 'week', 'month').default('month')
});

const eventWiseSchema = baseFilterSchema.keys({
  limit: Joi.number().integer().min(1).max(20).default(5)
});

const detailSchema = baseFilterSchema.keys({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('PENDING', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'COMPLETED').optional()
});

const parseFilters = (schema, query) => {
  const { error, value } = schema.validate(query, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return {
      error: error.details.map((detail) => detail.message).join(', ')
    };
  }

  if (value.startDate && value.endDate && new Date(value.startDate) > new Date(value.endDate)) {
    return { error: 'startDate must be before or equal to endDate' };
  }

  return { value };
};

const buildSqlFilters = (filters, options = {}) => {
  const clauses = [];
  const replacements = {};

  if (filters.department) {
    clauses.push('LOWER(p.department) = LOWER(:department)');
    replacements.department = filters.department;
  }

  if (filters.year) {
    clauses.push('p.year = :year');
    replacements.year = filters.year;
  }

  if (filters.event) {
    clauses.push('a.event_id = :eventId');
    replacements.eventId = filters.event;
  }

  if (filters.startDate) {
    clauses.push('a.created_at >= :startDate');
    replacements.startDate = filters.startDate;
  }

  if (filters.endDate) {
    clauses.push('a.created_at <= :endDate');
    replacements.endDate = filters.endDate;
  }

  if (options.status) {
    clauses.push('a.status = :status');
    replacements.status = options.status;
  }

  return {
    whereSql: clauses.length ? `AND ${clauses.join(' AND ')}` : '',
    replacements
  };
};

const getCache = (cacheKey) => {
  const cached = dashboardCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    dashboardCache.delete(cacheKey);
    return null;
  }

  return cached.value;
};

const setCache = (cacheKey, value) => {
  dashboardCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
};

const baseFromClause = `
  FROM applications a
  INNER JOIN users u ON u.id = a.student_id
  LEFT JOIN profiles p ON p.user_id = u.id
  INNER JOIN events e ON e.id = a.event_id
  WHERE 1 = 1
`;

const getParticipationSummaryData = async (filters) => {
  const { whereSql, replacements } = buildSqlFilters(filters);

  const summaryRows = await sequelize.query(
    `
      SELECT
        COUNT(*)::int AS total_applications,
        COUNT(*) FILTER (WHERE a.status = 'COMPLETED')::int AS total_participants
      ${baseFromClause}
      ${whereSql}
    `,
    {
      type: QueryTypes.SELECT,
      replacements
    }
  );

  const activeEventRows = await sequelize.query(
    `
      SELECT COUNT(DISTINCT e.id)::int AS active_events
      ${baseFromClause}
      ${whereSql}
      AND e.status = 'OPEN'
      AND e.approval_status = 'APPROVED'
    `,
    { type: QueryTypes.SELECT, replacements }
  );

  const summary = summaryRows[0] || { total_applications: 0, total_participants: 0 };
  const totalApplications = Number(summary.total_applications || 0);
  const totalParticipants = Number(summary.total_participants || 0);
  const participationRate = totalApplications === 0
    ? 0
    : Number(((totalParticipants / totalApplications) * 100).toFixed(2));

  return {
    totalApplications,
    totalParticipants,
    participationRate,
    activeEvents: Number(activeEventRows[0]?.active_events || 0)
  };
};

const getStudentParticipationHistory = async (studentId) => {
  const result = await Application.findAndCountAll({
    where: { student_id: studentId },
    include: [
      {
        association: 'event',
        attributes: ['id', 'title', 'event_name', 'category']
      }
    ],
    attributes: ['id', 'event_id', 'status', 'created_at', 'updated_at'],
    order: [['created_at', 'DESC']],
    limit: 10
  });

  const completedCount = await Application.count({
    where: {
      student_id: studentId,
      status: 'COMPLETED'
    }
  });

  return {
    totalApplications: result.count,
    completedCount,
    completionRate: result.count === 0 ? 0 : Number(((completedCount / result.count) * 100).toFixed(2)),
    recentHistory: result.rows
  };
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const parsed = parseFilters(baseFilterSchema, req.query);
    if (parsed.error) {
      return errorResponse(res, parsed.error, 400);
    }

    const filters = parsed.value;
    const cacheKey = `summary:${req.user.role}:${JSON.stringify(filters)}`;
    let data = getCache(cacheKey);

    if (!data) {
      data = await getParticipationSummaryData(filters);
      setCache(cacheKey, data);
    }

    if (req.user.role === 'STUDENT') {
      const myParticipation = await getStudentParticipationHistory(req.user.id);
      return successResponse(res, { ...data, myParticipation }, 'Dashboard summary fetched successfully');
    }

    return successResponse(res, data, 'Dashboard summary fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getDepartmentWiseAnalytics = async (req, res, next) => {
  try {
    const parsed = parseFilters(baseFilterSchema, req.query);
    if (parsed.error) {
      return errorResponse(res, parsed.error, 400);
    }

    const { whereSql, replacements } = buildSqlFilters(parsed.value);

    const rows = await sequelize.query(
      `
        SELECT
          COALESCE(p.department, 'UNKNOWN') AS label,
          COUNT(*)::int AS total_applications,
          COUNT(*) FILTER (WHERE a.status = 'COMPLETED')::int AS participants
        ${baseFromClause}
        ${whereSql}
        GROUP BY COALESCE(p.department, 'UNKNOWN')
        ORDER BY participants DESC, total_applications DESC
      `,
      {
        type: QueryTypes.SELECT,
        replacements
      }
    );

    return successResponse(res, { items: rows }, 'Department-wise analytics fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getYearWiseAnalytics = async (req, res, next) => {
  try {
    const parsed = parseFilters(baseFilterSchema, req.query);
    if (parsed.error) {
      return errorResponse(res, parsed.error, 400);
    }

    const { whereSql, replacements } = buildSqlFilters(parsed.value);

    const rows = await sequelize.query(
      `
        SELECT
          COALESCE(p.year::text, 'UNKNOWN') AS label,
          COUNT(*)::int AS total_applications,
          COUNT(*) FILTER (WHERE a.status = 'COMPLETED')::int AS participants
        ${baseFromClause}
        ${whereSql}
        GROUP BY COALESCE(p.year::text, 'UNKNOWN')
        ORDER BY
          CASE WHEN COALESCE(p.year::text, 'UNKNOWN') = 'UNKNOWN' THEN 999 ELSE COALESCE(p.year, 999) END ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements
      }
    );

    return successResponse(res, { items: rows }, 'Year-wise analytics fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getEventWiseAnalytics = async (req, res, next) => {
  try {
    const parsed = parseFilters(eventWiseSchema, req.query);
    if (parsed.error) {
      return errorResponse(res, parsed.error, 400);
    }

    const { limit, ...filters } = parsed.value;
    const { whereSql, replacements } = buildSqlFilters(filters);
    replacements.limit = limit;

    const rows = await sequelize.query(
      `
        SELECT
          e.id,
          e.title,
          e.event_name,
          COUNT(*)::int AS total_applications,
          COUNT(*) FILTER (WHERE a.status = 'COMPLETED')::int AS participants
        ${baseFromClause}
        ${whereSql}
        GROUP BY e.id, e.title, e.event_name
        ORDER BY participants DESC, total_applications DESC
        LIMIT :limit
      `,
      {
        type: QueryTypes.SELECT,
        replacements
      }
    );

    return successResponse(res, { items: rows }, 'Event-wise analytics fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getParticipationTrends = async (req, res, next) => {
  try {
    const parsed = parseFilters(trendFilterSchema, req.query);
    if (parsed.error) {
      return errorResponse(res, parsed.error, 400);
    }

    const { interval, ...filters } = parsed.value;
    const { whereSql, replacements } = buildSqlFilters(filters);
    replacements.interval = interval;

    const rows = await sequelize.query(
      `
        SELECT
          TO_CHAR(DATE_TRUNC(:interval, a.created_at), 'YYYY-MM-DD') AS label,
          COUNT(*)::int AS total_applications,
          COUNT(*) FILTER (WHERE a.status = 'COMPLETED')::int AS participants
        ${baseFromClause}
        ${whereSql}
        GROUP BY DATE_TRUNC(:interval, a.created_at)
        ORDER BY DATE_TRUNC(:interval, a.created_at) ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements
      }
    );

    return successResponse(res, { interval, points: rows }, 'Participation trends fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getSmartInsights = async (req, res, next) => {
  try {
    const parsed = parseFilters(baseFilterSchema, req.query);
    if (parsed.error) {
      return errorResponse(res, parsed.error, 400);
    }

    const filters = parsed.value;
    const { whereSql, replacements } = buildSqlFilters(filters);
    const summary = await getParticipationSummaryData(filters);

    const [topDepartment] = await sequelize.query(
      `
        SELECT COALESCE(p.department, 'UNKNOWN') AS label,
               COUNT(*) FILTER (WHERE a.status = 'COMPLETED')::int AS participants
        ${baseFromClause}
        ${whereSql}
        GROUP BY COALESCE(p.department, 'UNKNOWN')
        ORDER BY participants DESC
        LIMIT 1
      `,
      { type: QueryTypes.SELECT, replacements }
    );

    const trendRows = await sequelize.query(
      `
        SELECT
          TO_CHAR(DATE_TRUNC('month', a.created_at), 'YYYY-MM') AS month,
          COUNT(*) FILTER (WHERE a.status = 'COMPLETED')::int AS participants
        ${baseFromClause}
        ${whereSql}
        GROUP BY DATE_TRUNC('month', a.created_at)
        ORDER BY DATE_TRUNC('month', a.created_at) DESC
        LIMIT 2
      `,
      { type: QueryTypes.SELECT, replacements }
    );

    const insights = [];
    if (topDepartment?.label && Number(topDepartment.participants) > 0) {
      insights.push(`${topDepartment.label} department has the highest participation.`);
    }

    if (trendRows.length >= 2) {
      const latest = Number(trendRows[0].participants || 0);
      const previous = Number(trendRows[1].participants || 0);
      if (latest > previous) {
        insights.push('Participation increased this month compared to last month.');
      } else if (latest < previous) {
        insights.push('Participation decreased this month compared to last month.');
      } else {
        insights.push('Participation remained stable this month compared to last month.');
      }
    }

    if (summary.participationRate >= 50) {
      insights.push('Overall participation conversion is strong.');
    } else {
      insights.push('Participation conversion indicates room for better completion outcomes.');
    }

    return successResponse(res, {
      insights,
      metrics: summary
    }, 'Smart insights generated successfully');
  } catch (error) {
    next(error);
  }
};

export const getDashboardDetails = async (req, res, next) => {
  try {
    const parsed = parseFilters(detailSchema, req.query);
    if (parsed.error) {
      return errorResponse(res, parsed.error, 400);
    }

    const { page, limit, status, ...filters } = parsed.value;
    const offset = (page - 1) * limit;
    const { whereSql, replacements } = buildSqlFilters(filters, { status });

    replacements.limit = limit;
    replacements.offset = offset;

    const rows = await sequelize.query(
      `
        SELECT
          a.id,
          a.status,
          a.created_at,
          a.updated_at,
          a.student_id,
          u.full_name AS student_name,
          u.email AS student_email,
          COALESCE(p.department, 'UNKNOWN') AS department,
          p.year,
          e.id AS event_id,
          e.title AS event_title,
          e.event_name
        ${baseFromClause}
        ${whereSql}
        ORDER BY a.created_at DESC
        LIMIT :limit OFFSET :offset
      `,
      {
        type: QueryTypes.SELECT,
        replacements
      }
    );

    const countRows = await sequelize.query(
      `
        SELECT COUNT(*)::int AS total
        ${baseFromClause}
        ${whereSql}
      `,
      {
        type: QueryTypes.SELECT,
        replacements
      }
    );

    const total = Number(countRows[0]?.total || 0);
    return successResponse(res, {
      items: rows,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    }, 'Dashboard details fetched successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  getDashboardSummary,
  getDepartmentWiseAnalytics,
  getYearWiseAnalytics,
  getEventWiseAnalytics,
  getParticipationTrends,
  getSmartInsights,
  getDashboardDetails
};
