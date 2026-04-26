import express from 'express';
import {
  createDraft,
  getMyDrafts,
  updateDraft,
  deleteDraft,
  submitDraft
} from '../controllers/event-draft.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { draftEventSchema } from '../validations/event.validation.js';

const router = express.Router();

router.get('/my-drafts', authenticate, getMyDrafts);
router.post('/', authenticate, validate(draftEventSchema), createDraft);
router.put('/:id', authenticate, validate(draftEventSchema), updateDraft);
router.delete('/:id', authenticate, deleteDraft);
router.post('/:id/submit', authenticate, submitDraft);

export default router;
