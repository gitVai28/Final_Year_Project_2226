import { EventDraft, Event } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { createEventSchema } from '../validations/event.validation.js';

/**
 * Create event draft
 * POST /api/event-drafts
 */
export const createDraft = async (req, res, next) => {
  try {
    const draft = await EventDraft.create({
      ...req.body,
      created_by: req.user.id
    });

    return successResponse(res, { draft }, 'Draft saved successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's drafts
 * GET /api/event-drafts/my-drafts
 */
export const getMyDrafts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: drafts } = await EventDraft.findAndCountAll({
      where: {
        created_by: req.user.id
      },
      order: [['updated_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return successResponse(res, {
      drafts,
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
 * Update draft
 * PUT /api/event-drafts/:id
 */
export const updateDraft = async (req, res, next) => {
  try {
    const { id } = req.params;

    const draft = await EventDraft.findByPk(id);

    if (!draft) {
      return errorResponse(res, 'Draft not found', 404);
    }

    if (draft.created_by !== req.user.id) {
      return errorResponse(res, 'You are not authorized to update this draft', 403);
    }

    await draft.update(req.body);

    return successResponse(res, { draft }, 'Draft updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete draft
 * DELETE /api/event-drafts/:id
 */
export const deleteDraft = async (req, res, next) => {
  try {
    const { id } = req.params;

    const draft = await EventDraft.findByPk(id);

    if (!draft) {
      return errorResponse(res, 'Draft not found', 404);
    }

    if (draft.created_by !== req.user.id) {
      return errorResponse(res, 'You are not authorized to delete this draft', 403);
    }

    await draft.destroy();

    return successResponse(res, null, 'Draft deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Submit draft as event
 * POST /api/event-drafts/:id/submit
 */
export const submitDraft = async (req, res, next) => {
  try {
    const { id } = req.params;

    const draft = await EventDraft.findByPk(id);

    if (!draft) {
      return errorResponse(res, 'Draft not found', 404);
    }

    if (draft.created_by !== req.user.id) {
      return errorResponse(res, 'You are not authorized to submit this draft', 403);
    }

    const draftPayload = {
      title: draft.title,
      description: draft.description,
      event_name: draft.event_name,
      required_skills: draft.required_skills || [],
      category: draft.category,
      number_of_positions: draft.number_of_positions,
      deadline: draft.deadline
    };

    const { error, value } = createEventSchema.validate(draftPayload, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return errorResponse(res, 'Draft is incomplete. Finish the required fields before submitting.', 400, errors);
    }

    const event = await Event.create({
      ...value,
      created_by: req.user.id,
      status: 'OPEN',
      approval_status: 'PENDING_REVIEW'
    });

    await draft.destroy();

    return successResponse(
      res,
      { event },
      'Draft submitted successfully. It is now waiting for admin approval.',
      201
    );
  } catch (error) {
    next(error);
  }
};

export default {
  createDraft,
  getMyDrafts,
  updateDraft,
  deleteDraft,
  submitDraft
};
