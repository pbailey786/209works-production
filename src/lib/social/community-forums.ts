/**
 * Community Forums System
 * Reddit-style community forums for job seekers and employers
 */

import { prisma } from '@/lib/database/prisma';
import { processWithAI } from '@/lib/ai';
import { EnhancedCacheManager, CACHE_DURATIONS, CACHE_TAGS } from '@/lib/performance/enhanced-cache-manager';

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon: string;
  color: string;
  isActive: boolean;
  postCount: number;
  memberCount: number;
  moderators: string[];
  rules: string[];
  tags: string[];
  createdAt: Date;
}

export interface ForumPost {
  id: string;
  categoryId: string;
  authorId: string;
  title: string;
  content: string;
  type: 'discussion' | 'question' | 'job_share' | 'advice' | 'announcement';
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  viewCount: number;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    profilePictureUrl?: string;
    role: string;
    reputation: number;
    badges: string[];
  };
  category: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  parentId?: string;
  content: string;
  upvotes: number;
  downvotes: number;
  isAcceptedAnswer: boolean;
  isModerator: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    profilePictureUrl?: string;
    role: string;
    reputation: number;
    badges: string[];
  };
  replies?: ForumComment[];
}

export interface UserReputation {
  userId: string;
  totalReputation: number;
  monthlyReputation: number;
  badges: {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: Date;
  }[];
  achievements: {
    postsCreated: number;
    commentsPosted: number;
    upvotesReceived: number;
    bestAnswers: number;
    helpfulContributions: number;
  };
  level: string;
  nextLevelProgress: number;
}

export class CommunityForumsService {
  private static cache = new EnhancedCacheManager();

  /**
   * Get all forum categories
   */
  static async getForumCategories(): Promise<ForumCategory[]> {
    return this.cache.getOrSet(
      'forum-categories',
      async () => {
        const categories = await prisma.forumCategory.findMany({
          where: { isActive: true },
          include: {
            _count: {
              select: {
                posts: true,
                members: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        });

        return categories.map(category => ({
          ...category,
          postCount: category._count.posts,
          memberCount: category._count.members,
        }));
      },
      {
        ttl: CACHE_DURATIONS.LONG,
        tags: [CACHE_TAGS.FORUM_CATEGORIES],
      }
    );
  }

  /**
   * Get posts for a category with filtering and pagination
   */
  static async getCategoryPosts(
    categorySlug: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: 'newest' | 'oldest' | 'popular' | 'trending' | 'unanswered';
      filterBy?: {
        type?: string;
        tags?: string[];
        timeframe?: '24h' | '7d' | '30d' | 'all';
      };
      userId?: string;
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'newest',
      filterBy = {},
      userId,
    } = options;

    const skip = (page - 1) * limit;

    // Get category
    const category = await prisma.forumCategory.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Build where clause
    const where: any = {
      categoryId: category.id,
    };

    if (filterBy.type) {
      where.type = filterBy.type;
    }

    if (filterBy.tags && filterBy.tags.length > 0) {
      where.tags = {
        hasSome: filterBy.tags,
      };
    }

    if (filterBy.timeframe && filterBy.timeframe !== 'all') {
      const timeframeDays = {
        '24h': 1,
        '7d': 7,
        '30d': 30,
      };
      const daysAgo = timeframeDays[filterBy.timeframe];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      where.createdAt = { gte: cutoffDate };
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'popular':
        orderBy = { upvotes: 'desc' };
        break;
      case 'trending':
        orderBy = { lastActivityAt: 'desc' };
        break;
      case 'unanswered':
        where.commentCount = 0;
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [posts, totalCount] = await Promise.all([
      prisma.forumPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true,
              role: true,
              reputation: true,
              badges: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' }, // Pinned posts first
          orderBy,
        ],
        skip,
        take: limit,
      }),
      prisma.forumPost.count({ where }),
    ]);

    // Get user votes if userId provided
    let userVotes = {};
    if (userId) {
      const votes = await prisma.forumVote.findMany({
        where: {
          userId,
          postId: { in: posts.map(p => p.id) },
        },
      });
      userVotes = votes.reduce((acc, vote) => {
        acc[vote.postId] = vote.voteType;
        return acc;
      }, {} as Record<string, string>);
    }

    return {
      posts: posts.map(post => ({
        ...post,
        commentCount: post._count.comments,
        userVote: userVotes[post.id] || null,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      category,
    };
  }

  /**
   * Create a new forum post
   */
  static async createPost(
    userId: string,
    categorySlug: string,
    postData: {
      title: string;
      content: string;
      type: string;
      tags?: string[];
    }
  ): Promise<ForumPost> {
    // Get category
    const category = await prisma.forumCategory.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Validate content using AI moderation
    const moderationResult = await this.moderateContent(postData.title, postData.content);
    
    if (!moderationResult.approved) {
      throw new Error(`Post rejected: ${moderationResult.reason}`);
    }

    // Create post
    const post = await prisma.forumPost.create({
      data: {
        categoryId: category.id,
        authorId: userId,
        title: postData.title,
        content: postData.content,
        type: postData.type as any,
        tags: postData.tags || [],
        upvotes: 0,
        downvotes: 0,
        commentCount: 0,
        viewCount: 0,
        lastActivityAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
            role: true,
            reputation: true,
            badges: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
      },
    });

    // Award reputation points for posting
    await this.awardReputation(userId, 'post_created', 5);

    // Clear cache
    await this.cache.invalidateByTags([
      CACHE_TAGS.FORUM_CATEGORIES,
      `forum-posts:${categorySlug}`,
    ]);

    return post as ForumPost;
  }

  /**
   * Get post details with comments
   */
  static async getPostDetails(
    postId: string,
    userId?: string
  ): Promise<{
    post: ForumPost;
    comments: ForumComment[];
    userVote?: string;
  }> {
    // Increment view count
    await prisma.forumPost.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
            role: true,
            reputation: true,
            badges: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Get comments with nested replies
    const comments = await this.getPostComments(postId);

    // Get user vote if userId provided
    let userVote;
    if (userId) {
      const vote = await prisma.forumVote.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      userVote = vote?.voteType;
    }

    return {
      post: post as ForumPost,
      comments,
      userVote,
    };
  }

  /**
   * Vote on a post or comment
   */
  static async vote(
    userId: string,
    targetId: string,
    targetType: 'post' | 'comment',
    voteType: 'upvote' | 'downvote'
  ): Promise<{ upvotes: number; downvotes: number }> {
    // Check existing vote
    const existingVote = await prisma.forumVote.findUnique({
      where: {
        userId_postId: targetType === 'post' ? {
          userId,
          postId: targetId,
        } : undefined,
        userId_commentId: targetType === 'comment' ? {
          userId,
          commentId: targetId,
        } : undefined,
      },
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote if same type
        await prisma.forumVote.delete({
          where: { id: existingVote.id },
        });
      } else {
        // Update vote type
        await prisma.forumVote.update({
          where: { id: existingVote.id },
          data: { voteType },
        });
      }
    } else {
      // Create new vote
      await prisma.forumVote.create({
        data: {
          userId,
          ...(targetType === 'post' ? { postId: targetId } : { commentId: targetId }),
          voteType,
        },
      });
    }

    // Update vote counts
    const votes = await prisma.forumVote.groupBy({
      by: ['voteType'],
      where: targetType === 'post' ? { postId: targetId } : { commentId: targetId },
      _count: true,
    });

    const upvotes = votes.find(v => v.voteType === 'upvote')?._count || 0;
    const downvotes = votes.find(v => v.voteType === 'downvote')?._count || 0;

    // Update target with new counts
    if (targetType === 'post') {
      await prisma.forumPost.update({
        where: { id: targetId },
        data: { upvotes, downvotes },
      });
    } else {
      await prisma.forumComment.update({
        where: { id: targetId },
        data: { upvotes, downvotes },
      });
    }

    // Award reputation for receiving upvotes
    if (voteType === 'upvote') {
      const target = targetType === 'post' 
        ? await prisma.forumPost.findUnique({ where: { id: targetId }, select: { authorId: true } })
        : await prisma.forumComment.findUnique({ where: { id: targetId }, select: { authorId: true } });
      
      if (target) {
        await this.awardReputation(target.authorId, 'upvote_received', 2);
      }
    }

    return { upvotes, downvotes };
  }

  /**
   * Get user reputation and achievements
   */
  static async getUserReputation(userId: string): Promise<UserReputation> {
    return this.cache.getOrSet(
      `user-reputation:${userId}`,
      async () => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            reputation: true,
            badges: true,
            _count: {
              select: {
                forumPosts: true,
                forumComments: true,
              },
            },
          },
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Calculate monthly reputation (simplified)
        const monthlyReputation = Math.floor(user.reputation * 0.1);

        // Get upvotes received
        const upvotesReceived = await this.getUserUpvotesReceived(userId);

        // Get best answers count
        const bestAnswers = await prisma.forumComment.count({
          where: {
            authorId: userId,
            isAcceptedAnswer: true,
          },
        });

        // Calculate level and progress
        const { level, nextLevelProgress } = this.calculateUserLevel(user.reputation);

        return {
          userId,
          totalReputation: user.reputation,
          monthlyReputation,
          badges: user.badges || [],
          achievements: {
            postsCreated: user._count.forumPosts,
            commentsPosted: user._count.forumComments,
            upvotesReceived,
            bestAnswers,
            helpfulContributions: upvotesReceived + bestAnswers,
          },
          level,
          nextLevelProgress,
        };
      },
      {
        ttl: CACHE_DURATIONS.MEDIUM,
        tags: [`user-reputation:${userId}`, CACHE_TAGS.USER_DATA],
      }
    );
  }

  // Private helper methods

  private static async moderateContent(title: string, content: string): Promise<{
    approved: boolean;
    reason?: string;
  }> {
    const prompt = `
Moderate this forum post for appropriateness:

Title: ${title}
Content: ${content}

Check for:
1. Spam or promotional content
2. Inappropriate language
3. Off-topic content
4. Personal attacks
5. Misinformation

Return JSON with "approved" (boolean) and "reason" (string if not approved).
    `;

    try {
      const result = await processWithAI(prompt, {
        systemPrompt: 'You are a content moderator for a professional job forum.',
        maxTokens: 200,
        temperature: 0.1,
        context: 'Content Moderation',
      });

      const parsed = JSON.parse(result);
      return {
        approved: parsed.approved !== false,
        reason: parsed.reason,
      };
    } catch (error) {
      // Default to approved if AI moderation fails
      return { approved: true };
    }
  }

  private static async awardReputation(
    userId: string,
    action: string,
    points: number
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        reputation: { increment: points },
      },
    });

    // Check for badge eligibility
    await this.checkBadgeEligibility(userId);

    // Clear cache
    await this.cache.invalidateByTags([`user-reputation:${userId}`]);
  }

  private static async getPostComments(postId: string): Promise<ForumComment[]> {
    const comments = await prisma.forumComment.findMany({
      where: { postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
            role: true,
            reputation: true,
            badges: true,
          },
        },
      },
      orderBy: [
        { isAcceptedAnswer: 'desc' },
        { upvotes: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // Build nested comment structure
    const commentMap = new Map();
    const rootComments: ForumComment[] = [];

    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return rootComments;
  }

  private static async getUserUpvotesReceived(userId: string): Promise<number> {
    const [postUpvotes, commentUpvotes] = await Promise.all([
      prisma.forumVote.count({
        where: {
          voteType: 'upvote',
          post: { authorId: userId },
        },
      }),
      prisma.forumVote.count({
        where: {
          voteType: 'upvote',
          comment: { authorId: userId },
        },
      }),
    ]);

    return postUpvotes + commentUpvotes;
  }

  private static calculateUserLevel(reputation: number): {
    level: string;
    nextLevelProgress: number;
  } {
    const levels = [
      { name: 'Newcomer', min: 0, max: 99 },
      { name: 'Contributor', min: 100, max: 499 },
      { name: 'Regular', min: 500, max: 999 },
      { name: 'Veteran', min: 1000, max: 2499 },
      { name: 'Expert', min: 2500, max: 4999 },
      { name: 'Master', min: 5000, max: 9999 },
      { name: 'Legend', min: 10000, max: Infinity },
    ];

    const currentLevel = levels.find(level => 
      reputation >= level.min && reputation <= level.max
    ) || levels[0];

    const nextLevel = levels[levels.indexOf(currentLevel) + 1];
    const progress = nextLevel 
      ? ((reputation - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
      : 100;

    return {
      level: currentLevel.name,
      nextLevelProgress: Math.min(100, Math.max(0, progress)),
    };
  }

  private static async checkBadgeEligibility(userId: string): Promise<void> {
    // Implementation for checking and awarding badges
    // This would check various criteria and award badges accordingly
  }
}
