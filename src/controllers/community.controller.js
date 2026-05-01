import { Op } from 'sequelize';
import {
  Community,
  CommunityMember,
  CommunityPost,
  PostComment,
  PostLike,
  User,
  Profile
} from '../models/index.js';
import { successResponse, errorResponse } from '../utils/response.js';

// ─────────────────────────────────────────────
// COMMUNITY MANAGEMENT
// ─────────────────────────────────────────────

/**
 * Create a new community (Admin only)
 * POST /api/communities
 */
export const createCommunity = async (req, res, next) => {
  try {
    const { name, department, description } = req.body;

    // Check if a community for this department already exists
    const existing = await Community.findOne({ where: { department } });
    if (existing) {
      return errorResponse(res, `A community for department "${department}" already exists`, 409);
    }

    const community = await Community.create({
      name,
      department,
      description: description || null,
      created_by: req.user.id
    });

    return successResponse(res, { community }, 'Community created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all communities, optionally filtered by department
 * GET /api/communities?department=CSE
 */
export const getCommunities = async (req, res, next) => {
  try {
    const { department, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (department) {
      whereClause.department = { [Op.iLike]: `%${department}%` };
    }

    const { count, rows: communities } = await Community.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'full_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Attach member count to each community
    const communitiesWithCount = await Promise.all(
      communities.map(async (c) => {
        const memberCount = await CommunityMember.count({
          where: { community_id: c.id }
        });
        return { ...c.toJSON(), member_count: memberCount };
      })
    );

    return successResponse(res, {
      communities: communitiesWithCount,
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
 * Get a single community by ID
 * GET /api/communities/:id
 */
export const getCommunityById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const community = await Community.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'full_name', 'email']
        }
      ]
    });

    if (!community) {
      return errorResponse(res, 'Community not found', 404);
    }

    const memberCount = await CommunityMember.count({ where: { community_id: id } });

    return successResponse(res, {
      community: { ...community.toJSON(), member_count: memberCount }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join a community
 * POST /api/communities/:id/join
 */
export const joinCommunity = async (req, res, next) => {
  try {
    const { id } = req.params;

    const community = await Community.findByPk(id);
    if (!community) {
      return errorResponse(res, 'Community not found', 404);
    }

    const [membership, created] = await CommunityMember.findOrCreate({
      where: { user_id: req.user.id, community_id: id },
      defaults: {
        user_id: req.user.id,
        community_id: id,
        role: 'MEMBER'
      }
    });

    if (!created) {
      return errorResponse(res, 'You are already a member of this community', 409);
    }

    return successResponse(res, { membership }, 'Joined community successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Leave a community
 * DELETE /api/communities/:id/leave
 */
export const leaveCommunity = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await CommunityMember.destroy({
      where: { user_id: req.user.id, community_id: id }
    });

    if (!deleted) {
      return errorResponse(res, 'You are not a member of this community', 404);
    }

    return successResponse(res, null, 'Left community successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get members of a community (members only)
 * GET /api/communities/:id/members
 */
export const getCommunityMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const community = await Community.findByPk(id);
    if (!community) {
      return errorResponse(res, 'Community not found', 404);
    }

    // Only members can view the member list
    const isMember = await CommunityMember.findOne({
      where: { user_id: req.user.id, community_id: id }
    });
    if (!isMember) {
      return errorResponse(res, 'You must be a member to view the member list', 403);
    }

    const { count, rows: memberships } = await CommunityMember.findAndCountAll({
      where: { community_id: id },
      include: [
        {
          model: User,
          as: 'member',
          attributes: ['id', 'full_name', 'email'],
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: ['department', 'year', 'profile_picture']
            }
          ]
        }
      ],
      order: [['created_at', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return successResponse(res, {
      members: memberships,
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

// ─────────────────────────────────────────────
// POST MANAGEMENT
// ─────────────────────────────────────────────

/**
 * Create a post in a community (members only)
 * POST /api/communities/:id/posts
 */
export const createPost = async (req, res, next) => {
  try {
    const { id: community_id } = req.params;
    const { title, description, type } = req.body;

    const community = await Community.findByPk(community_id);
    if (!community) {
      return errorResponse(res, 'Community not found', 404);
    }

    // Only members can post
    const isMember = await CommunityMember.findOne({
      where: { user_id: req.user.id, community_id }
    });
    if (!isMember) {
      return errorResponse(res, 'You must be a member to post in this community', 403);
    }

    // Build file metadata if a file was uploaded
    let file_url = null;
    let file_name = null;
    let file_size = null;
    let file_type = null;

    if (req.file) {
      // Serve uploaded files from /uploads/community/
      file_url = `/uploads/community/${req.file.filename}`;
      file_name = req.file.originalname;
      file_size = req.file.size;
      file_type = req.file.mimetype;
    }

    const post = await CommunityPost.create({
      user_id: req.user.id,
      community_id,
      title,
      description: description || null,
      type,
      file_url,
      file_name,
      file_size,
      file_type
    });

    const postWithAuthor = await CommunityPost.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'full_name', 'email']
        }
      ]
    });

    return successResponse(res, { post: postWithAuthor }, 'Post created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get posts in a community (members only), with optional type filter
 * GET /api/communities/:id/posts?type=NOTES&page=1&limit=10
 */
export const getCommunityPosts = async (req, res, next) => {
  try {
    const { id: community_id } = req.params;
    const { type, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const community = await Community.findByPk(community_id);
    if (!community) {
      return errorResponse(res, 'Community not found', 404);
    }

    // Only members can view posts
    const isMember = await CommunityMember.findOne({
      where: { user_id: req.user.id, community_id }
    });
    if (!isMember) {
      return errorResponse(res, 'You must be a member to view posts', 403);
    }

    const whereClause = { community_id };
    if (type && ['NOTES', 'PYQ', 'ASSIGNMENT'].includes(type)) {
      whereClause.type = type;
    }

    const { count, rows: posts } = await CommunityPost.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'full_name', 'email'],
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: ['profile_picture', 'department']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Attach like count and comment count to each post
    const postsWithMeta = await Promise.all(
      posts.map(async (p) => {
        const [likeCount, commentCount, userLiked] = await Promise.all([
          PostLike.count({ where: { post_id: p.id } }),
          PostComment.count({ where: { post_id: p.id } }),
          PostLike.findOne({ where: { post_id: p.id, user_id: req.user.id } })
        ]);
        return {
          ...p.toJSON(),
          like_count: likeCount,
          comment_count: commentCount,
          liked_by_me: !!userLiked
        };
      })
    );

    return successResponse(res, {
      posts: postsWithMeta,
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
 * Get a single post by ID (members only)
 * GET /api/communities/:id/posts/:postId
 */
export const getPostById = async (req, res, next) => {
  try {
    const { id: community_id, postId } = req.params;

    // Only members can view posts
    const isMember = await CommunityMember.findOne({
      where: { user_id: req.user.id, community_id }
    });
    if (!isMember) {
      return errorResponse(res, 'You must be a member to view posts', 403);
    }

    const post = await CommunityPost.findOne({
      where: { id: postId, community_id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'full_name', 'email'],
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: ['profile_picture', 'department']
            }
          ]
        },
        {
          model: PostComment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'commenter',
              attributes: ['id', 'full_name', 'email'],
              include: [
                {
                  model: Profile,
                  as: 'profile',
                  attributes: ['profile_picture']
                }
              ]
            }
          ],
          order: [['created_at', 'ASC']]
        }
      ]
    });

    if (!post) {
      return errorResponse(res, 'Post not found', 404);
    }

    const [likeCount, userLiked] = await Promise.all([
      PostLike.count({ where: { post_id: postId } }),
      PostLike.findOne({ where: { post_id: postId, user_id: req.user.id } })
    ]);

    return successResponse(res, {
      post: {
        ...post.toJSON(),
        like_count: likeCount,
        liked_by_me: !!userLiked
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a post (owner or community admin)
 * DELETE /api/communities/:id/posts/:postId
 */
export const deletePost = async (req, res, next) => {
  try {
    const { id: community_id, postId } = req.params;

    const post = await CommunityPost.findOne({ where: { id: postId, community_id } });
    if (!post) {
      return errorResponse(res, 'Post not found', 404);
    }

    // Allow deletion if user is the post owner OR a community ADMIN
    const isOwner = post.user_id === req.user.id;
    const isAdmin = await CommunityMember.findOne({
      where: { user_id: req.user.id, community_id, role: 'ADMIN' }
    });
    const isSiteAdmin = req.user.role === 'COLLEGE_ADMIN';

    if (!isOwner && !isAdmin && !isSiteAdmin) {
      return errorResponse(res, 'You are not authorized to delete this post', 403);
    }

    await post.destroy();

    return successResponse(res, null, 'Post deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// LIKES
// ─────────────────────────────────────────────

/**
 * Toggle like on a post (members only)
 * POST /api/communities/:id/posts/:postId/like
 */
export const toggleLike = async (req, res, next) => {
  try {
    const { id: community_id, postId } = req.params;

    // Only members can like
    const isMember = await CommunityMember.findOne({
      where: { user_id: req.user.id, community_id }
    });
    if (!isMember) {
      return errorResponse(res, 'You must be a member to like posts', 403);
    }

    const post = await CommunityPost.findOne({ where: { id: postId, community_id } });
    if (!post) {
      return errorResponse(res, 'Post not found', 404);
    }

    const existingLike = await PostLike.findOne({
      where: { post_id: postId, user_id: req.user.id }
    });

    if (existingLike) {
      await existingLike.destroy();
      const likeCount = await PostLike.count({ where: { post_id: postId } });
      return successResponse(res, { liked: false, like_count: likeCount }, 'Post unliked');
    }

    await PostLike.create({ post_id: postId, user_id: req.user.id });
    const likeCount = await PostLike.count({ where: { post_id: postId } });
    return successResponse(res, { liked: true, like_count: likeCount }, 'Post liked');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────────

/**
 * Add a comment to a post (members only)
 * POST /api/communities/:id/posts/:postId/comments
 */
export const addComment = async (req, res, next) => {
  try {
    const { id: community_id, postId } = req.params;
    const { content } = req.body;

    // Only members can comment
    const isMember = await CommunityMember.findOne({
      where: { user_id: req.user.id, community_id }
    });
    if (!isMember) {
      return errorResponse(res, 'You must be a member to comment', 403);
    }

    const post = await CommunityPost.findOne({ where: { id: postId, community_id } });
    if (!post) {
      return errorResponse(res, 'Post not found', 404);
    }

    const comment = await PostComment.create({
      post_id: postId,
      user_id: req.user.id,
      content
    });

    const commentWithUser = await PostComment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'commenter',
          attributes: ['id', 'full_name', 'email'],
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: ['profile_picture']
            }
          ]
        }
      ]
    });

    return successResponse(res, { comment: commentWithUser }, 'Comment added successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a comment (owner or community admin)
 * DELETE /api/communities/:id/posts/:postId/comments/:commentId
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { id: community_id, postId, commentId } = req.params;

    const comment = await PostComment.findOne({ where: { id: commentId, post_id: postId } });
    if (!comment) {
      return errorResponse(res, 'Comment not found', 404);
    }

    const isOwner = comment.user_id === req.user.id;
    const isAdmin = await CommunityMember.findOne({
      where: { user_id: req.user.id, community_id, role: 'ADMIN' }
    });
    const isSiteAdmin = req.user.role === 'COLLEGE_ADMIN';

    if (!isOwner && !isAdmin && !isSiteAdmin) {
      return errorResponse(res, 'You are not authorized to delete this comment', 403);
    }

    await comment.destroy();

    return successResponse(res, null, 'Comment deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Auto-join a user to their department community (called after profile update)
 * This is a utility function, not a route handler
 */
export const autoJoinDepartmentCommunity = async (userId, department) => {
  try {
    if (!department) return;

    const community = await Community.findOne({ where: { department } });
    if (!community) return;

    await CommunityMember.findOrCreate({
      where: { user_id: userId, community_id: community.id },
      defaults: { user_id: userId, community_id: community.id, role: 'MEMBER' }
    });
  } catch (error) {
    console.error('Auto-join community error:', error.message);
  }
};
