/**
 * Job Cache Service
 * Handles caching of job-related data for performance optimization
 */

import { getCache, setCache, invalidateCache } from '@/lib/cache/redis';

export interface CachedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  requirements: string[];
  benefits: string[];
  postedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  isFeatured: boolean;
  applicationCount: number;
  viewCount: number;
}

export interface JobSearchCache {
  query: string;
  filters: Record<string, any>;
  results: CachedJob[];
  total: number;
  timestamp: Date;
}

export class JobCacheService {
  private static readonly CACHE_PREFIX = 'job:';
  private static readonly SEARCH_CACHE_PREFIX = 'job_search:';
  private static readonly STATS_CACHE_PREFIX = 'job_stats:';
  
  // Cache TTL in seconds
  private static readonly JOB_TTL = 3600; // 1 hour
  private static readonly SEARCH_TTL = 900; // 15 minutes
  private static readonly STATS_TTL = 1800; // 30 minutes

  /**
   * Cache a single job
   */
  static async cacheJob(job: CachedJob): Promise<void> {
    const key = `${this.CACHE_PREFIX}${job.id}`;
    await setCache(key, job, this.JOB_TTL);
  }

  /**
   * Get cached job by ID
   */
  static async getCachedJob(jobId: string): Promise<CachedJob | null> {
    const key = `${this.CACHE_PREFIX}${jobId}`;
    return await getCache<CachedJob>(key);
  }

  /**
   * Cache multiple jobs
   */
  static async cacheJobs(jobs: CachedJob[]): Promise<void> {
    const promises = jobs.map(job => this.cacheJob(job));
    await Promise.all(promises);
  }

  /**
   * Cache job search results
   */
  static async cacheJobSearch(
    query: string,
    filters: Record<string, any>,
    results: CachedJob[],
    total: number
  ): Promise<void> {
    const searchKey = this.generateSearchKey(query, filters);
    const cacheData: JobSearchCache = {
      query,
      filters,
      results,
      total,
      timestamp: new Date()
    };
    
    await setCache(searchKey, cacheData, this.SEARCH_TTL);
  }

  /**
   * Get cached job search results
   */
  static async getCachedJobSearch(
    query: string,
    filters: Record<string, any>
  ): Promise<JobSearchCache | null> {
    const searchKey = this.generateSearchKey(query, filters);
    return await getCache<JobSearchCache>(searchKey);
  }

  /**
   * Cache job statistics
   */
  static async cacheJobStats(stats: {
    totalJobs: number;
    activeJobs: number;
    featuredJobs: number;
    newJobsToday: number;
    totalApplications: number;
    averageSalary?: number;
    topCompanies: Array<{ name: string; jobCount: number }>;
    topLocations: Array<{ location: string; jobCount: number }>;
  }): Promise<void> {
    const key = `${this.STATS_CACHE_PREFIX}general`;
    await setCache(key, stats, this.STATS_TTL);
  }

  /**
   * Get cached job statistics
   */
  static async getCachedJobStats() {
    const key = `${this.STATS_CACHE_PREFIX}general`;
    return await getCache(key);
  }

  /**
   * Cache company job count
   */
  static async cacheCompanyJobCount(companyId: string, count: number): Promise<void> {
    const key = `${this.CACHE_PREFIX}company:${companyId}:count`;
    await setCache(key, count, this.JOB_TTL);
  }

  /**
   * Get cached company job count
   */
  static async getCachedCompanyJobCount(companyId: string): Promise<number | null> {
    const key = `${this.CACHE_PREFIX}company:${companyId}:count`;
    return await getCache<number>(key);
  }

  /**
   * Cache job recommendations for a user
   */
  static async cacheJobRecommendations(
    userId: string,
    recommendations: CachedJob[]
  ): Promise<void> {
    const key = `${this.CACHE_PREFIX}recommendations:${userId}`;
    await setCache(key, recommendations, this.JOB_TTL);
  }

  /**
   * Get cached job recommendations for a user
   */
  static async getCachedJobRecommendations(userId: string): Promise<CachedJob[] | null> {
    const key = `${this.CACHE_PREFIX}recommendations:${userId}`;
    return await getCache<CachedJob[]>(key);
  }

  /**
   * Cache similar jobs
   */
  static async cacheSimilarJobs(jobId: string, similarJobs: CachedJob[]): Promise<void> {
    const key = `${this.CACHE_PREFIX}similar:${jobId}`;
    await setCache(key, similarJobs, this.JOB_TTL);
  }

  /**
   * Get cached similar jobs
   */
  static async getCachedSimilarJobs(jobId: string): Promise<CachedJob[] | null> {
    const key = `${this.CACHE_PREFIX}similar:${jobId}`;
    return await getCache<CachedJob[]>(key);
  }

  /**
   * Invalidate job cache
   */
  static async invalidateJob(jobId: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}${jobId}`;
    await invalidateCache(key);
    
    // Also invalidate related caches
    await this.invalidateJobSearches();
    await this.invalidateJobStats();
  }

  /**
   * Invalidate all job search caches
   */
  static async invalidateJobSearches(): Promise<void> {
    await invalidateCache(`${this.SEARCH_CACHE_PREFIX}*`);
  }

  /**
   * Invalidate job statistics cache
   */
  static async invalidateJobStats(): Promise<void> {
    await invalidateCache(`${this.STATS_CACHE_PREFIX}*`);
  }

  /**
   * Invalidate company-related caches
   */
  static async invalidateCompanyCache(companyId: string): Promise<void> {
    await invalidateCache(`${this.CACHE_PREFIX}company:${companyId}:*`);
    await this.invalidateJobSearches();
    await this.invalidateJobStats();
  }

  /**
   * Invalidate user-specific caches
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    await invalidateCache(`${this.CACHE_PREFIX}recommendations:${userId}`);
  }

  /**
   * Warm up cache with popular jobs
   */
  static async warmUpCache(popularJobs: CachedJob[]): Promise<void> {
    await this.cacheJobs(popularJobs);
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
    jobsCached: number;
    searchesCached: number;
    statsCached: number;
    totalCacheSize: number;
  }> {
    // This would need to be implemented based on your Redis setup
    // For now, return placeholder data
    return {
      jobsCached: 0,
      searchesCached: 0,
      statsCached: 0,
      totalCacheSize: 0
    };
  }

  /**
   * Clear all job-related caches
   */
  static async clearAllCache(): Promise<void> {
    await Promise.all([
      invalidateCache(`${this.CACHE_PREFIX}*`),
      invalidateCache(`${this.SEARCH_CACHE_PREFIX}*`),
      invalidateCache(`${this.STATS_CACHE_PREFIX}*`)
    ]);
  }

  /**
   * Preload job data for better performance
   */
  static async preloadJobData(jobIds: string[]): Promise<CachedJob[]> {
    const promises = jobIds.map(id => this.getCachedJob(id));
    const results = await Promise.all(promises);
    return results.filter((job): job is CachedJob => job !== null);
  }
}
