/**
 * User Cache Service
 * Handles caching of user-related data for performance optimization
 */

import { getCache, setCache, invalidateCache } from '@/lib/cache/redis';

export interface CachedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastActive: Date | null;
  profile?: {
    location?: string;
    skills?: string[];
    experienceLevel?: string;
    resumeUrl?: string;
    bio?: string;
  };
  preferences?: {
    jobTypes?: string[];
    locations?: string[];
    salaryRange?: { min: number; max: number };
    remoteWork?: boolean;
  };
  stats?: {
    applicationsCount: number;
    savedJobsCount: number;
    profileViews: number;
    searchesCount: number;
  };
}

export interface UserSearchCache {
  query: string;
  filters: Record<string, any>;
  results: CachedUser[];
  total: number;
  timestamp: Date;
}

export class UserCacheService {
  private static readonly CACHE_PREFIX = 'user:';
  private static readonly SEARCH_CACHE_PREFIX = 'user_search:';
  private static readonly STATS_CACHE_PREFIX = 'user_stats:';
  private static readonly PROFILE_CACHE_PREFIX = 'user_profile:';
  
  // Cache TTL in seconds
  private static readonly USER_TTL = 3600; // 1 hour
  private static readonly SEARCH_TTL = 900; // 15 minutes
  private static readonly STATS_TTL = 1800; // 30 minutes
  private static readonly PROFILE_TTL = 7200; // 2 hours

  /**
   * Cache a single user
   */
  static async cacheUser(user: CachedUser): Promise<void> {
    const key = `${this.CACHE_PREFIX}${user.id}`;
    await setCache(key, user, this.USER_TTL);
  }

  /**
   * Get cached user by ID
   */
  static async getCachedUser(userId: string): Promise<CachedUser | null> {
    const key = `${this.CACHE_PREFIX}${userId}`;
    return await getCache<CachedUser>(key);
  }

  /**
   * Cache multiple users
   */
  static async cacheUsers(users: CachedUser[]): Promise<void> {
    const promises = users.map(user => this.cacheUser(user));
    await Promise.all(promises);
  }

  /**
   * Cache user profile data
   */
  static async cacheUserProfile(userId: string, profile: CachedUser['profile']): Promise<void> {
    const key = `${this.PROFILE_CACHE_PREFIX}${userId}`;
    await setCache(key, profile, this.PROFILE_TTL);
  }

  /**
   * Get cached user profile
   */
  static async getCachedUserProfile(userId: string): Promise<CachedUser['profile'] | null> {
    const key = `${this.PROFILE_CACHE_PREFIX}${userId}`;
    return await getCache<CachedUser['profile']>(key);
  }

  /**
   * Cache user search results
   */
  static async cacheUserSearch(
    query: string,
    filters: Record<string, any>,
    results: CachedUser[],
    total: number
  ): Promise<void> {
    const searchKey = this.generateSearchKey(query, filters);
    const cacheData: UserSearchCache = {
      query,
      filters,
      results,
      total,
      timestamp: new Date()
    };
    
    await setCache(searchKey, cacheData, this.SEARCH_TTL);
  }

  /**
   * Get cached user search results
   */
  static async getCachedUserSearch(
    query: string,
    filters: Record<string, any>
  ): Promise<UserSearchCache | null> {
    const searchKey = this.generateSearchKey(query, filters);
    return await getCache<UserSearchCache>(searchKey);
  }

  /**
   * Cache user statistics
   */
  static async cacheUserStats(userId: string, stats: CachedUser['stats']): Promise<void> {
    const key = `${this.STATS_CACHE_PREFIX}${userId}`;
    await setCache(key, stats, this.STATS_TTL);
  }

  /**
   * Get cached user statistics
   */
  static async getCachedUserStats(userId: string): Promise<CachedUser['stats'] | null> {
    const key = `${this.STATS_CACHE_PREFIX}${userId}`;
    return await getCache<CachedUser['stats']>(key);
  }

  /**
   * Cache global user statistics
   */
  static async cacheGlobalUserStats(stats: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    jobSeekers: number;
    employers: number;
    averageApplicationsPerUser: number;
    topSkills: Array<{ skill: string; count: number }>;
    topLocations: Array<{ location: string; count: number }>;
  }): Promise<void> {
    const key = `${this.STATS_CACHE_PREFIX}global`;
    await setCache(key, stats, this.STATS_TTL);
  }

  /**
   * Get cached global user statistics
   */
  static async getCachedGlobalUserStats() {
    const key = `${this.STATS_CACHE_PREFIX}global`;
    return await getCache(key);
  }

  /**
   * Cache user applications
   */
  static async cacheUserApplications(userId: string, applications: any[]): Promise<void> {
    const key = `${this.CACHE_PREFIX}${userId}:applications`;
    await setCache(key, applications, this.USER_TTL);
  }

  /**
   * Get cached user applications
   */
  static async getCachedUserApplications(userId: string): Promise<any[] | null> {
    const key = `${this.CACHE_PREFIX}${userId}:applications`;
    return await getCache<any[]>(key);
  }

  /**
   * Cache user saved jobs
   */
  static async cacheUserSavedJobs(userId: string, savedJobs: any[]): Promise<void> {
    const key = `${this.CACHE_PREFIX}${userId}:saved_jobs`;
    await setCache(key, savedJobs, this.USER_TTL);
  }

  /**
   * Get cached user saved jobs
   */
  static async getCachedUserSavedJobs(userId: string): Promise<any[] | null> {
    const key = `${this.CACHE_PREFIX}${userId}:saved_jobs`;
    return await getCache<any[]>(key);
  }

  /**
   * Cache user preferences
   */
  static async cacheUserPreferences(userId: string, preferences: CachedUser['preferences']): Promise<void> {
    const key = `${this.CACHE_PREFIX}${userId}:preferences`;
    await setCache(key, preferences, this.PROFILE_TTL);
  }

  /**
   * Get cached user preferences
   */
  static async getCachedUserPreferences(userId: string): Promise<CachedUser['preferences'] | null> {
    const key = `${this.CACHE_PREFIX}${userId}:preferences`;
    return await getCache<CachedUser['preferences']>(key);
  }

  /**
   * Invalidate user cache
   */
  static async invalidateUser(userId: string): Promise<void> {
    const patterns = [
      `${this.CACHE_PREFIX}${userId}`,
      `${this.PROFILE_CACHE_PREFIX}${userId}`,
      `${this.STATS_CACHE_PREFIX}${userId}`,
      `${this.CACHE_PREFIX}${userId}:*`
    ];
    
    await Promise.all(patterns.map(pattern => invalidateCache(pattern)));
    
    // Also invalidate search caches
    await this.invalidateUserSearches();
    await this.invalidateGlobalStats();
  }

  /**
   * Invalidate all user search caches
   */
  static async invalidateUserSearches(): Promise<void> {
    await invalidateCache(`${this.SEARCH_CACHE_PREFIX}*`);
  }

  /**
   * Invalidate global user statistics
   */
  static async invalidateGlobalStats(): Promise<void> {
    await invalidateCache(`${this.STATS_CACHE_PREFIX}global`);
  }

  /**
   * Warm up cache with active users
   */
  static async warmUpCache(activeUsers: CachedUser[]): Promise<void> {
    await this.cacheUsers(activeUsers);
  }

  /**
   * Generate search cache key
   */
  private static generateSearchKey(query: string, filters: Record<string, any>): string {
    const filterString = JSON.stringify(filters);
    const hash = this.simpleHash(query + filterString);
    return `${this.SEARCH_CACHE_PREFIX}${hash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    usersCached: number;
    profilesCached: number;
    searchesCached: number;
    statsCached: number;
  }> {
    // This would need to be implemented based on your Redis setup
    // For now, return placeholder data
    return {
      usersCached: 0,
      profilesCached: 0,
      searchesCached: 0,
      statsCached: 0
    };
  }

  /**
   * Clear all user-related caches
   */
  static async clearAllCache(): Promise<void> {
    await Promise.all([
      invalidateCache(`${this.CACHE_PREFIX}*`),
      invalidateCache(`${this.SEARCH_CACHE_PREFIX}*`),
      invalidateCache(`${this.STATS_CACHE_PREFIX}*`),
      invalidateCache(`${this.PROFILE_CACHE_PREFIX}*`)
    ]);
  }

  /**
   * Preload user data for better performance
   */
  static async preloadUserData(userIds: string[]): Promise<CachedUser[]> {
    const promises = userIds.map(id => this.getCachedUser(id));
    const results = await Promise.all(promises);
    return results.filter((user): user is CachedUser => user !== null);
  }

  /**
   * Update user last active timestamp
   */
  static async updateUserLastActive(userId: string): Promise<void> {
    const cachedUser = await this.getCachedUser(userId);
    if (cachedUser) {
      cachedUser.lastActive = new Date();
      await this.cacheUser(cachedUser);
    }
  }
}
