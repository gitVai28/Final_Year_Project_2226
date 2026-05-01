import express from 'express';
import {
  createCommunity,
  getCommunities,
  getCommunityById,
  joinCommunity,
  leaveCommunity,
  getCommunityMembers,
  createPost,
  getCommunityPosts,
  getPostById,
  deletePost,
  toggleLike,
  addComment,
  deleteComment
} from '../controllers/community.controller.js';
import { authenticate, isAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { handleFileUpload } from '../utils/upload.js';
import {
  createCommunitySchema,
  createPostSchema,
  addCommentSchema
} from '../validations/community.validation.js';

const router = express.Router();

// ─────────────────────────────────────────────
// COMMUNITY ROUTES
// ─────────────────────────────────────────────

/**
 * @route   POST /api/communities
 * @desc    Create a new department community
 * @access  Private (Admin only)
 */
router.post('/', authenticate, isAdmin, validate(createCommunitySchema), createCommunity);

/**
 * @route   GET /api/communities
 * @desc    Get all communities (optionally filter by ?department=CSE)
 * @access  Private
 */
router.get('/', authenticate, getCommunities);

/**
 * @route   GET /api/communities/:id
 * @desc    Get a single community by ID
 * @access  Private
 */
router.get('/:id', authenticate, getCommunityById);

/**
 * @route   POST /api/communities/:id/join
 * @desc    Join a community
 * @access  Private
 */
router.post('/:id/join', authenticate, joinCommunity);

/**
 * @route   DELETE /api/communities/:id/leave
 * @desc    Leave a community
 * @access  Private
 */
router.delete('/:id/leave', authenticate, leaveCommunity);

/**
 * @route   GET /api/communities/:id/members
 * @desc    Get members of a community (members only)
 * @access  Private (Members only)
 */
router.get('/:id/members', authenticate, getCommunityMembers);

// ─────────────────────────────────────────────
// POST ROUTES
// ─────────────────────────────────────────────

/**
 * @route   POST /api/communities/:id/posts
 * @desc    Create a post (upload file + metadata)
 * @access  Private (Members only)
 */
router.post(
  '/:id/posts',
  authenticate,
  handleFileUpload,
  validate(createPostSchema),
  createPost
);

/**
 * @route   GET /api/communities/:id/posts
 * @desc    Get posts in a community (filter by ?type=NOTES|PYQ|ASSIGNMENT)
 * @access  Private (Members only)
 */
router.get('/:id/posts', authenticate, getCommunityPosts);

/**
 * @route   GET /api/communities/:id/posts/:postId
 * @desc    Get a single post with comments
 * @access  Private (Members only)
 */
router.get('/:id/posts/:postId', authenticate, getPostById);

/**
 * @route   DELETE /api/communities/:id/posts/:postId
 * @desc    Delete a post (owner or community admin)
 * @access  Private
 */
router.delete('/:id/posts/:postId', authenticate, deletePost);

// ─────────────────────────────────────────────
// LIKE ROUTES
// ─────────────────────────────────────────────

/**
 * @route   POST /api/communities/:id/posts/:postId/like
 * @desc    Toggle like on a post
 * @access  Private (Members only)
 */
router.post('/:id/posts/:postId/like', authenticate, toggleLike);

// ─────────────────────────────────────────────
// COMMENT ROUTES
// ─────────────────────────────────────────────

/**
 * @route   POST /api/communities/:id/posts/:postId/comments
 * @desc    Add a comment to a post
 * @access  Private (Members only)
 */
router.post(
  '/:id/posts/:postId/comments',
  authenticate,
  validate(addCommentSchema),
  addComment
);

/**
 * @route   DELETE /api/communities/:id/posts/:postId/comments/:commentId
 * @desc    Delete a comment (owner or community admin)
 * @access  Private
 */
router.delete('/:id/posts/:postId/comments/:commentId', authenticate, deleteComment);

export default router;
