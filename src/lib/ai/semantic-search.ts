/**
 * Semantic Search Engine with AI-Powered Job Matching
 * Advanced search capabilities using OpenAI embeddings and semantic similarity
 */

import OpenAI from 'openai';
import { prisma } from '@/lib/database/prisma';
import { getDomainConfig } from '@/lib/domain/config';
import { EnhancedCacheManager, CACHE_DURATIONS, CACHE_TAGS } from '@/lib/performance/enhanced-cache-manager';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SemanticSearchParams {
  query: string;
  region: string;
  filters?: {
    jobType?: string;
    experienceLevel?: string;
    salaryMin?: number;
    salaryMax?: number;
    remote?: boolean;
    skills?: string[];
    location?: string;
  };
  limit?: number;
  threshold?: number; // Similarity threshold (0-1)
}

export interface SemanticSearchResult {
  job: any;
  semanticScore: number;
  relevanceScore: number;
  matchedConcepts: string[];
  explanation: string;
}

export interface JobRecommendation {
  job: any;
  score: number;
  reasons: string[];
  matchType: 'skills' | 'experience' | 'location' | 'salary' | 'semantic';
}

/**
 * Semantic Search Engine with AI-powered matching
 */
export class SemanticSearchEngine {
  private static readonly EMBEDDING_MODEL = 'text-embedding-3-small';
  private static readonly SIMILARITY_THRESHOLD = 0.7;
  private static readonly MAX_RESULTS = 50;

  /**
   * Perform semantic search for jobs
   */
  static async searchJobs(params: SemanticSearchParams): Promise<SemanticSearchResult[]> {
    const { query, region, filters = {}, limit = 20, threshold = this.SIMILARITY_THRESHOLD } = params;

    // Create cache key for semantic search
    const cacheKey = `semantic-search:${region}:${query}:${JSON.stringify(filters)}`;
    
    return EnhancedCacheManager.createCachedFunction(
      async () => {
        // Generate embedding for the search query
        const queryEmbedding = await this.generateEmbedding(query);
        
        // Get domain configuration for regional filtering
        const domainConfig = getDomainConfig(`${region}.works`);
        
        // Build base query with regional filtering
        const whereClause: any = {
          status: 'ACTIVE',
          OR: [
            { region: region },
            { location: { contains: domainConfig.region, mode: 'insensitive' } },
            { 
              location: { 
                in: domainConfig.cities.map(city => city.toLowerCase())
              }
            }
          ]
        };

        // Add filters
        if (filters.jobType) whereClause.jobType = filters.jobType;
        if (filters.experienceLevel) whereClause.experienceLevel = filters.experienceLevel;
        if (filters.salaryMin) whereClause.salaryMin = { gte: filters.salaryMin };
        if (filters.salaryMax) whereClause.salaryMax = { lte: filters.salaryMax };
        if (filters.remote) whereClause.remote = true;
        if (filters.location) {
          whereClause.location = { contains: filters.location, mode: 'insensitive' };
        }

        // Get jobs from database
        const jobs = await prisma.job.findMany({
          where: whereClause,
          take: this.MAX_RESULTS,
          include: {
            jobApplications: {
              select: { id: true, status: true }
            }
          }
        });

        // Calculate semantic similarity for each job
        const results: SemanticSearchResult[] = [];
        
        for (const job of jobs) {
          // Create job text for embedding
          const jobText = this.createJobText(job);
          
          // Generate embedding for job (with caching)
          const jobEmbedding = await this.getJobEmbedding(job.id, jobText);
          
          // Calculate semantic similarity
          const semanticScore = this.calculateCosineSimilarity(queryEmbedding, jobEmbedding);
          
          // Skip jobs below threshold
          if (semanticScore < threshold) continue;
          
          // Calculate traditional relevance score
          const relevanceScore = this.calculateRelevanceScore(job, query);
          
          // Extract matched concepts
          const matchedConcepts = this.extractMatchedConcepts(query, jobText);
          
          // Generate explanation
          const explanation = this.generateExplanation(job, query, semanticScore, matchedConcepts);
          
          results.push({
            job,
            semanticScore,
            relevanceScore,
            matchedConcepts,
            explanation,
          });
        }

        // Sort by combined score (semantic + relevance)
        results.sort((a, b) => {
          const scoreA = (a.semanticScore * 0.7) + (a.relevanceScore * 0.3);
          const scoreB = (b.semanticScore * 0.7) + (b.relevanceScore * 0.3);
          return scoreB - scoreA;
        });

        return results.slice(0, limit);
      },
      {
        keyPrefix: cacheKey,
        ttl: CACHE_DURATIONS.MEDIUM,
        tags: [CACHE_TAGS.SEARCH, CACHE_TAGS.AI_RESPONSES],
        regional: true,
      }
    )();
  }

  /**
   * Get AI-powered job recommendations for a user
   */
  static async getJobRecommendations(params: {
    userId: string;
    region: string;
    limit?: number;
  }): Promise<JobRecommendation[]> {
    const { userId, region, limit = 10 } = params;

    return EnhancedCacheManager.createCachedFunction(
      async () => {
        // Get user profile and preferences
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            jobSeekerProfile: {
              include: {
                savedJobs: true,
                jobApplications: {
                  include: { job: true }
                }
              }
            }
          }
        });

        if (!user?.jobSeekerProfile) {
          return [];
        }

        const profile = user.jobSeekerProfile;
        
        // Create user preference text
        const userText = this.createUserPreferenceText(profile);
        
        // Generate user embedding
        const userEmbedding = await this.generateEmbedding(userText);
        
        // Get domain configuration
        const domainConfig = getDomainConfig(`${region}.works`);
        
        // Get available jobs (excluding already applied)
        const appliedJobIds = profile.jobApplications.map(app => app.job.id);
        
        const jobs = await prisma.job.findMany({
          where: {
            status: 'ACTIVE',
            id: { notIn: appliedJobIds },
            OR: [
              { region: region },
              { location: { contains: domainConfig.region, mode: 'insensitive' } },
            ]
          },
          take: 100, // Get more for better recommendations
        });

        // Calculate recommendations
        const recommendations: JobRecommendation[] = [];
        
        for (const job of jobs) {
          const jobText = this.createJobText(job);
          const jobEmbedding = await this.getJobEmbedding(job.id, jobText);
          
          // Calculate semantic similarity
          const semanticScore = this.calculateCosineSimilarity(userEmbedding, jobEmbedding);
          
          // Calculate other matching factors
          const skillsMatch = this.calculateSkillsMatch(profile, job);
          const experienceMatch = this.calculateExperienceMatch(profile, job);
          const locationMatch = this.calculateLocationMatch(profile, job);
          const salaryMatch = this.calculateSalaryMatch(profile, job);
          
          // Combine scores
          const totalScore = (
            semanticScore * 0.4 +
            skillsMatch * 0.25 +
            experienceMatch * 0.15 +
            locationMatch * 0.1 +
            salaryMatch * 0.1
          );
          
          // Generate reasons
          const reasons = this.generateRecommendationReasons(
            semanticScore,
            skillsMatch,
            experienceMatch,
            locationMatch,
            salaryMatch
          );
          
          // Determine primary match type
          const matchType = this.determinePrimaryMatchType(
            semanticScore,
            skillsMatch,
            experienceMatch,
            locationMatch,
            salaryMatch
          );
          
          if (totalScore > 0.6) { // Threshold for recommendations
            recommendations.push({
              job,
              score: totalScore,
              reasons,
              matchType,
            });
          }
        }

        // Sort by score and return top recommendations
        return recommendations
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      },
      {
        keyPrefix: `recommendations:${userId}:${region}`,
        ttl: CACHE_DURATIONS.LONG,
        tags: [CACHE_TAGS.RECOMMENDATIONS, CACHE_TAGS.AI_RESPONSES],
        regional: true,
      }
    )();
  }

  /**
   * Generate embedding for text
   */
  private static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: text.substring(0, 8000), // Limit input length
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Return zero vector as fallback
      return new Array(1536).fill(0);
    }
  }

  /**
   * Get or generate job embedding with caching
   */
  private static async getJobEmbedding(jobId: string, jobText: string): Promise<number[]> {
    return EnhancedCacheManager.createCachedFunction(
      async () => this.generateEmbedding(jobText),
      {
        keyPrefix: `job-embedding:${jobId}`,
        ttl: CACHE_DURATIONS.WEEKLY,
        tags: [CACHE_TAGS.AI_RESPONSES],
      }
    )();
  }

  /**
   * Create searchable text from job data
   */
  private static createJobText(job: any): string {
    const parts = [
      job.title,
      job.company,
      job.description,
      job.location,
      job.jobType,
      job.experienceLevel,
      ...(job.categories || []),
      ...(job.skills || []),
    ].filter(Boolean);
    
    return parts.join(' ');
  }

  /**
   * Create user preference text from profile
   */
  private static createUserPreferenceText(profile: any): string {
    const parts = [
      profile.desiredJobTitle,
      profile.bio,
      profile.location,
      profile.preferredJobType,
      profile.experienceLevel,
      ...(profile.skills || []),
      ...(profile.interests || []),
    ].filter(Boolean);
    
    return parts.join(' ');
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private static calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate traditional relevance score
   */
  private static calculateRelevanceScore(job: any, query: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;
    
    // Title match (highest weight)
    if (job.title.toLowerCase().includes(queryLower)) score += 0.4;
    
    // Company match
    if (job.company.toLowerCase().includes(queryLower)) score += 0.2;
    
    // Description match
    if (job.description.toLowerCase().includes(queryLower)) score += 0.2;
    
    // Category/skills match
    const categories = job.categories || [];
    const skills = job.skills || [];
    const allTags = [...categories, ...skills];
    
    for (const tag of allTags) {
      if (tag.toLowerCase().includes(queryLower)) {
        score += 0.1;
        break;
      }
    }
    
    return Math.min(score, 1); // Cap at 1
  }

  /**
   * Extract matched concepts between query and job
   */
  private static extractMatchedConcepts(query: string, jobText: string): string[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const jobWords = jobText.toLowerCase().split(/\s+/);
    
    const matches: string[] = [];
    
    for (const word of queryWords) {
      if (word.length > 3 && jobWords.includes(word)) {
        matches.push(word);
      }
    }
    
    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Generate explanation for why a job matches
   */
  private static generateExplanation(
    job: any,
    query: string,
    semanticScore: number,
    matchedConcepts: string[]
  ): string {
    const explanations: string[] = [];
    
    if (semanticScore > 0.8) {
      explanations.push('Strong semantic match with your search');
    } else if (semanticScore > 0.7) {
      explanations.push('Good semantic match');
    }
    
    if (matchedConcepts.length > 0) {
      explanations.push(`Matches: ${matchedConcepts.slice(0, 3).join(', ')}`);
    }
    
    if (job.title.toLowerCase().includes(query.toLowerCase())) {
      explanations.push('Title contains your search terms');
    }
    
    return explanations.join('. ') || 'Relevant based on AI analysis';
  }

  // Helper methods for recommendation scoring
  private static calculateSkillsMatch(profile: any, job: any): number {
    const profileSkills = (profile.skills || []).map((s: string) => s.toLowerCase());
    const jobSkills = (job.skills || []).map((s: string) => s.toLowerCase());
    
    if (profileSkills.length === 0 || jobSkills.length === 0) return 0;
    
    const matches = profileSkills.filter((skill: string) => jobSkills.includes(skill));
    return matches.length / Math.max(profileSkills.length, jobSkills.length);
  }

  private static calculateExperienceMatch(profile: any, job: any): number {
    const experienceLevels = ['entry', 'junior', 'mid', 'senior', 'lead', 'principal'];
    const profileLevel = experienceLevels.indexOf(profile.experienceLevel?.toLowerCase() || '');
    const jobLevel = experienceLevels.indexOf(job.experienceLevel?.toLowerCase() || '');
    
    if (profileLevel === -1 || jobLevel === -1) return 0.5;
    
    const diff = Math.abs(profileLevel - jobLevel);
    return Math.max(0, 1 - (diff * 0.2));
  }

  private static calculateLocationMatch(profile: any, job: any): number {
    if (!profile.location || !job.location) return 0.5;
    
    const profileLocation = profile.location.toLowerCase();
    const jobLocation = job.location.toLowerCase();
    
    if (profileLocation === jobLocation) return 1;
    if (jobLocation.includes(profileLocation) || profileLocation.includes(jobLocation)) return 0.8;
    if (job.remote) return 0.9;
    
    return 0.3;
  }

  private static calculateSalaryMatch(profile: any, job: any): number {
    if (!profile.desiredSalary || !job.salaryMin) return 0.5;
    
    const desired = profile.desiredSalary;
    const jobMin = job.salaryMin;
    const jobMax = job.salaryMax || jobMin;
    
    if (desired >= jobMin && desired <= jobMax) return 1;
    if (desired < jobMin) return Math.max(0, 1 - ((jobMin - desired) / desired));
    if (desired > jobMax) return Math.max(0, 1 - ((desired - jobMax) / jobMax));
    
    return 0.5;
  }

  private static generateRecommendationReasons(
    semantic: number,
    skills: number,
    experience: number,
    location: number,
    salary: number
  ): string[] {
    const reasons: string[] = [];
    
    if (semantic > 0.8) reasons.push('Strong AI match based on your profile');
    if (skills > 0.6) reasons.push('Good skills alignment');
    if (experience > 0.8) reasons.push('Perfect experience level match');
    if (location > 0.8) reasons.push('Great location match');
    if (salary > 0.8) reasons.push('Salary matches your expectations');
    
    return reasons.length > 0 ? reasons : ['AI recommends this job for you'];
  }

  private static determinePrimaryMatchType(
    semantic: number,
    skills: number,
    experience: number,
    location: number,
    salary: number
  ): JobRecommendation['matchType'] {
    const scores = { semantic, skills, experience, location, salary };
    const maxScore = Math.max(...Object.values(scores));
    
    if (scores.semantic === maxScore) return 'semantic';
    if (scores.skills === maxScore) return 'skills';
    if (scores.experience === maxScore) return 'experience';
    if (scores.location === maxScore) return 'location';
    return 'salary';
  }
}

export default SemanticSearchEngine;
