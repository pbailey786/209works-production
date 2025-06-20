import { prisma } from '@/lib/database/prisma';

  EnhancedSearchFilters,
  SearchResult,
  TextProcessor,
  RelevanceScorer,
  GeolocationUtils,
  SEARCH_CONFIG,
} from '@/components/ui/card';
import {
  import {
  getCache,
  setCache,
  generateCacheKey,
  CACHE_PREFIXES,
  DEFAULT_TTL,
} from '../cache/redis';

// Enhanced alert criteria interface
export interface AlertCriteria {
  keywords?: string[];
  jobTitle?: string;
  company?: string;
  location?: string;
  remote?: boolean;
  jobType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  excludeKeywords?: string[];
  categories?: string[];
  companies?: string[];
}

// Job matching result interface
interface JobMatchResult {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  isRemote?: boolean;
  skills?: string[];
  description: string;
  createdAt: Date;
  relevanceScore: number;
  matchedFields: string[];
  snippet?: string;
  semanticScore?: number;
  locationScore?: number;
  skillsScore?: number;
  experienceScore?: number;
}

// Match quality metrics
interface MatchQuality {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'no_matches';
  feedback: string;
  distribution: {
    total: number;
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  improvements: string[];
}

// Enhanced Job Matching Algorithm
export class EnhancedJobMatchingService {
  private static readonly CACHE_TTL = DEFAULT_TTL.short;
  private static readonly CACHE_TAGS = ['job-matching', 'alerts'];

  // Weights for different matching criteria
  private static readonly MATCHING_WEIGHTS = {
    semantic: 0.35, // Title and description matching
    skills: 0.25, // Skills compatibility
    location: 0.15, // Geographic relevance
    experience: 0.1, // Experience level match
    salary: 0.1, // Salary range compatibility
    company: 0.05, // Company preference
  };

  // TF-IDF scoring thresholds
  private static readonly TFIDF_THRESHOLDS = {
    high: 0.7,
    medium: 0.4,
    low: 0.2,
  };

  // Main job matching function
  static async findMatchingJobs(
    criteria: AlertCriteria,
    maxResults: number = 50,
    useAdvancedScoring: boolean = true
  ): Promise<JobMatchResult[]> {
    const cacheKey = generateCacheKey(
      CACHE_PREFIXES.search,
      'job-matches',
      JSON.stringify(criteria),
      maxResults.toString()
    );

    // Try cache first
    const cached = await getCache<JobMatchResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Build enhanced database query
      const whereCondition = this.buildEnhancedWhereCondition(criteria);

      // Get a larger pool for better scoring
      const jobPool = await prisma.job.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        take: Math.min(maxResults * 3, 200), // Get 3x more for better filtering
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          jobType: true,
          salaryMin: true,
          salaryMax: true,
          description: true,
          categories: true,
          createdAt: true,
          // Add any other fields you need
        },
      });

      // Apply advanced scoring if enabled
      let scoredJobs: JobMatchResult[];
      if (useAdvancedScoring) {
        scoredJobs = await this.scoreJobsAdvanced(jobPool, criteria);
      } else {
        scoredJobs = this.scoreJobsBasic(jobPool, criteria);
      }

      // Sort by relevance score and take top results
      const topMatches = scoredJobs
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

      // Cache the results
      await setCache(cacheKey, topMatches, {
        ttl: this.CACHE_TTL,
        tags: this.CACHE_TAGS,
      });

      return topMatches;
    } catch (error) {
      console.error('Error in job matching:', error);
      return [];
    }
  }

  // Advanced scoring with semantic analysis
  private static async scoreJobsAdvanced(
    jobs: any[],
    criteria: AlertCriteria
  ): Promise<JobMatchResult[]> {
    const scoredJobs: JobMatchResult[] = [];

    for (const job of jobs) {
      const scores = {
        semantic: this.calculateSemanticScore(job, criteria),
        skills: this.calculateSkillsScore(job, criteria),
        location: this.calculateLocationScore(job, criteria),
        experience: this.calculateExperienceScore(job, criteria),
        salary: this.calculateSalaryScore(job, criteria),
        company: this.calculateCompanyScore(job, criteria),
      };

      // Calculate weighted relevance score
      const relevanceScore = Object.entries(scores).reduce(
        (total, [key, score]) =>
          total +
          score *
            this.MATCHING_WEIGHTS[key as keyof typeof this.MATCHING_WEIGHTS],
        0
      );

      const matchedFields = this.getMatchedFields(job, criteria);
      const snippet = this.generateSnippet(job, criteria);

      scoredJobs.push({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        jobType: job.type,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        isRemote: job.isRemote,
        skills: job.skills || [],
        description: job.description,
        createdAt: job.createdAt,
        relevanceScore: Math.round(relevanceScore * 100) / 100,
        matchedFields,
        snippet,
        semanticScore: scores.semantic,
        locationScore: scores.location,
        skillsScore: scores.skills,
        experienceScore: scores.experience,
      });
    }

    return scoredJobs;
  }

  // Basic scoring (fallback)
  private static scoreJobsBasic(
    jobs: any[],
    criteria: AlertCriteria
  ): JobMatchResult[] {
    return jobs.map(job => {
      const relevanceScore = this.calculateBasicRelevanceScore(job, criteria);
      const matchedFields = this.getMatchedFields(job, criteria);

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        jobType: job.type,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        isRemote: job.isRemote,
        skills: job.skills || [],
        description: job.description,
        createdAt: job.createdAt,
        relevanceScore,
        matchedFields,
      };
    });
  }

  // Enhanced semantic scoring using TF-IDF-like approach
  private static calculateSemanticScore(
    job: any,
    criteria: AlertCriteria
  ): number {
    const jobText =
      `${job.title} ${job.description} ${job.company}`.toLowerCase();
    const searchTerms = [
      ...(criteria.keywords || []),
      ...(criteria.jobTitle ? [criteria.jobTitle] : []),
      ...(criteria.company ? [criteria.company] : []),
    ].map(term => term.toLowerCase());

    if (searchTerms.length === 0) return 0.5; // Neutral score

    let totalScore = 0;
    let termCount = 0;

    for (const term of searchTerms) {
      // Calculate term frequency in job text
      const termRegex = new RegExp(
        term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'gi'
      );
      const matches = jobText.match(termRegex) || [];
      const termFrequency = matches.length;

      if (termFrequency > 0) {
        // Weight based on where the term appears
        let positionWeight = 1;
        if (job.title.toLowerCase().includes(term)) {
          positionWeight = 2.0; // Title matches are most important
        } else if (job.company.toLowerCase().includes(term)) {
          positionWeight = 1.5; // Company matches are second most important
        }

        // Calculate TF-IDF-like score
        const tfScore = termFrequency / jobText.split(' ').length;
        const relevanceScore = Math.min(tfScore * positionWeight * 10, 1.0);

        totalScore += relevanceScore;
      }
      termCount++;
    }

    return termCount > 0 ? totalScore / termCount : 0;
  }

  // Skills compatibility scoring
  private static calculateSkillsScore(
    job: any,
    criteria: AlertCriteria
  ): number {
    if (!criteria.skills || criteria.skills.length === 0) return 0.5;
    if (!job.skills || job.skills.length === 0) return 0;

    const jobSkills = job.skills.map((skill: string) => skill.toLowerCase());
    const requiredSkills = criteria.skills.map(skill => skill.toLowerCase());

    const matchedSkills = requiredSkills.filter(skill =>
      jobSkills.some(
        (jobSkill: string) =>
          jobSkill.includes(skill) || skill.includes(jobSkill)
      )
    );

    return matchedSkills.length / requiredSkills.length;
  }

  // Location relevance scoring
  private static calculateLocationScore(
    job: any,
    criteria: AlertCriteria
  ): number {
    if (!criteria.location) return 0.5; // Neutral if no location preference

    const jobLocation = job.location?.toLowerCase() || '';
    const preferredLocation = criteria.location.toLowerCase();

    // Exact match
    if (jobLocation.includes(preferredLocation)) return 1.0;

    // Remote job bonus if location is important
    if (job.isRemote && criteria.remote !== false) return 0.8;

    // Partial location matching (city, state, etc.)
    const locationParts = preferredLocation.split(/[,\s]+/);
    let partialMatches = 0;

    for (const part of locationParts) {
      if (part.length >= 3 && jobLocation.includes(part)) {
        partialMatches++;
      }
    }

    return (partialMatches / locationParts.length) * 0.6;
  }

  // Experience level compatibility
  private static calculateExperienceScore(
    job: any,
    criteria: AlertCriteria
  ): number {
    if (!criteria.experienceLevel || !job.experienceLevel) return 0.5;

    const jobLevel = job.experienceLevel.toLowerCase();
    const requiredLevel = criteria.experienceLevel.toLowerCase();

    if (jobLevel === requiredLevel) return 1.0;

    // Create experience hierarchy
    const levels = ['entry', 'junior', 'mid', 'senior', 'lead', 'principal'];
    const jobIndex = levels.findIndex(level => jobLevel.includes(level));
    const requiredIndex = levels.findIndex(level =>
      requiredLevel.includes(level)
    );

    if (jobIndex === -1 || requiredIndex === -1) return 0.3;

    // Calculate proximity score
    const distance = Math.abs(jobIndex - requiredIndex);
    return Math.max(0, 1 - distance * 0.2);
  }

  // Salary range compatibility
  private static calculateSalaryScore(
    job: any,
    criteria: AlertCriteria
  ): number {
    if (!criteria.salaryMin && !criteria.salaryMax) return 0.5;

    const jobMin = job.salaryMin || 0;
    const jobMax = job.salaryMax || 999999;
    const prefMin = criteria.salaryMin || 0;
    const prefMax = criteria.salaryMax || 999999;

    // Check for overlap
    if (jobMax >= prefMin && jobMin <= prefMax) {
      // Calculate overlap percentage
      const overlapStart = Math.max(jobMin, prefMin);
      const overlapEnd = Math.min(jobMax, prefMax);
      const overlapSize = overlapEnd - overlapStart;
      const prefRange = prefMax - prefMin;
      const jobRange = jobMax - jobMin;

      if (prefRange === 0 || jobRange === 0) return 1.0;

      return Math.min(overlapSize / Math.min(prefRange, jobRange), 1.0);
    }

    return 0;
  }

  // Company preference scoring
  private static calculateCompanyScore(
    job: any,
    criteria: AlertCriteria
  ): number {
    if (
      !criteria.company &&
      (!criteria.companies || criteria.companies.length === 0)
    ) {
      return 0.5; // Neutral if no company preference
    }

    const jobCompany = job.company.toLowerCase();

    // Check direct company preference
    if (
      criteria.company &&
      jobCompany.includes(criteria.company.toLowerCase())
    ) {
      return 1.0;
    }

    // Check company list
    if (criteria.companies) {
      for (const company of criteria.companies) {
        if (jobCompany.includes(company.toLowerCase())) {
          return 1.0;
        }
      }
    }

    return 0;
  }

  // Basic relevance score (fallback)
  private static calculateBasicRelevanceScore(
    job: any,
    criteria: AlertCriteria
  ): number {
    let score = 0;
    let maxScore = 100;

    // Title/keyword matching (30 points)
    if (
      criteria.keywords?.some(keyword =>
        job.title.toLowerCase().includes(keyword.toLowerCase())
      )
    ) {
      score += 30;
    }

    // Company match (20 points)
    if (
      criteria.company &&
      job.company.toLowerCase().includes(criteria.company.toLowerCase())
    ) {
      score += 20;
    }

    // Location match (15 points)
    if (
      criteria.location &&
      job.location?.toLowerCase().includes(criteria.location.toLowerCase())
    ) {
      score += 15;
    }

    // Skills match (25 points)
    if (criteria.skills && job.skills) {
      const matchedSkills = criteria.skills.filter(skill =>
        job.skills.some((jobSkill: string) =>
          jobSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      score += (matchedSkills.length / criteria.skills.length) * 25;
    }

    // Job type match (10 points)
    if (criteria.jobType === job.type) {
      score += 10;
    }

    return Math.min(score, maxScore);
  }

  // Enhanced where condition builder
  private static buildEnhancedWhereCondition(criteria: AlertCriteria): any {
    const where: any = {};
    const andConditions: any[] = [];

    // Basic active job filter
    andConditions.push({
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    });

    // Text-based search conditions
    if (criteria.keywords?.length || criteria.jobTitle) {
      const searchTerms = [
        ...(criteria.keywords || []),
        ...(criteria.jobTitle ? [criteria.jobTitle] : []),
      ];

      const textConditions = {
        OR: searchTerms.flatMap(term => [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { company: { contains: term, mode: 'insensitive' } },
        ]),
      };

      andConditions.push(textConditions);
    }

    // Company filtering
    if (criteria.company) {
      andConditions.push({
        company: { contains: criteria.company, mode: 'insensitive' },
      });
    }

    if (criteria.companies?.length) {
      andConditions.push({
        OR: criteria.companies.map(company => ({
          company: { contains: company, mode: 'insensitive' },
        })),
      });
    }

    // Location filtering
    if (criteria.location) {
      andConditions.push({
        location: { contains: criteria.location, mode: 'insensitive' },
      });
    }

    // Remote work filtering
    if (criteria.remote !== undefined) {
      andConditions.push({ isRemote: criteria.remote });
    }

    // Job type filtering
    if (criteria.jobType) {
      andConditions.push({ type: criteria.jobType });
    }

    // Experience level filtering
    if (criteria.experienceLevel) {
      andConditions.push({ experienceLevel: criteria.experienceLevel });
    }

    // Salary filtering
    if (criteria.salaryMin) {
      andConditions.push({
        OR: [
          { salaryMin: { gte: criteria.salaryMin } },
          { salaryMax: { gte: criteria.salaryMin } },
        ],
      });
    }

    if (criteria.salaryMax) {
      andConditions.push({
        OR: [
          { salaryMax: { lte: criteria.salaryMax } },
          { salaryMin: { lte: criteria.salaryMax } },
        ],
      });
    }

    // Skills filtering
    if (criteria.skills?.length) {
      andConditions.push({
        OR: [
          { categories: { hasSome: criteria.skills } },
          // Add more sophisticated skills matching if skills field exists
        ],
      });
    }

    // Categories filtering
    if (criteria.categories?.length) {
      andConditions.push({
        categories: { hasSome: criteria.categories },
      });
    }

    // Exclude unwanted keywords
    if (criteria.excludeKeywords?.length) {
      andConditions.push({
        NOT: {
          OR: criteria.excludeKeywords.flatMap(keyword => [
            { title: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
          ]),
        },
      });
    }

    return andConditions.length > 0 ? { AND: andConditions } : {};
  }

  // Get matched fields for highlighting
  private static getMatchedFields(job: any, criteria: AlertCriteria): string[] {
    const matchedFields: string[] = [];

    // Check title matches
    const searchTerms = [
      ...(criteria.keywords || []),
      ...(criteria.jobTitle ? [criteria.jobTitle] : []),
    ];

    if (
      searchTerms.some(term =>
        job.title.toLowerCase().includes(term.toLowerCase())
      )
    ) {
      matchedFields.push('title');
    }

    // Check company matches
    if (
      criteria.company &&
      job.company.toLowerCase().includes(criteria.company.toLowerCase())
    ) {
      matchedFields.push('company');
    }

    // Check location matches
    if (
      criteria.location &&
      job.location?.toLowerCase().includes(criteria.location.toLowerCase())
    ) {
      matchedFields.push('location');
    }

    // Check skills matches
    if (
      criteria.skills &&
      job.skills?.some((skill: string) =>
        criteria.skills!.some(reqSkill =>
          skill.toLowerCase().includes(reqSkill.toLowerCase())
        )
      )
    ) {
      matchedFields.push('skills');
    }

    // Check description matches
    if (
      searchTerms.some(term =>
        job.description.toLowerCase().includes(term.toLowerCase())
      )
    ) {
      matchedFields.push('description');
    }

    return matchedFields;
  }

  // Generate highlighted snippet
  private static generateSnippet(
    job: any,
    criteria: AlertCriteria,
    maxLength: number = 200
  ): string {
    const searchTerms = [
      ...(criteria.keywords || []),
      ...(criteria.jobTitle ? [criteria.jobTitle] : []),
    ];

    if (searchTerms.length === 0) {
      return job.description.substring(0, maxLength) + '...';
    }

    const description = job.description.toLowerCase();

    // Find the best sentence that contains search terms
    const sentences = job.description.split(/[.!?]+/);
    let bestSentence = sentences[0] || '';
    let maxMatches = 0;

    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      const matches = searchTerms.filter(term =>
        sentenceLower.includes(term.toLowerCase())
      ).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence;
      }
    }

    // Truncate if too long
    if (bestSentence.length > maxLength) {
      bestSentence = bestSentence.substring(0, maxLength - 3) + '...';
    }

    return bestSentence.trim();
  }

  // Calculate comprehensive match quality
  static calculateMatchQuality(
    criteria: AlertCriteria,
    jobs: JobMatchResult[]
  ): MatchQuality {
    if (jobs.length === 0) {
      return {
        score: 0,
        level: 'no_matches',
        feedback:
          'No jobs found matching your criteria. Consider broadening your search parameters.',
        distribution: { total: 0, excellent: 0, good: 0, fair: 0, poor: 0 },
        improvements: [
          'Try using broader keywords',
          'Expand location search radius',
          'Consider remote work options',
          'Review salary expectations',
        ],
      };
    }

    // Calculate score distribution
    const distribution = {
      total: jobs.length,
      excellent: jobs.filter(job => job.relevanceScore >= 80).length,
      good: jobs.filter(
        job => job.relevanceScore >= 60 && job.relevanceScore < 80
      ).length,
      fair: jobs.filter(
        job => job.relevanceScore >= 40 && job.relevanceScore < 60
      ).length,
      poor: jobs.filter(job => job.relevanceScore < 40).length,
    };

    // Calculate average relevance score
    const avgScore =
      jobs.reduce((sum, job) => sum + job.relevanceScore, 0) / jobs.length;

    // Determine quality level and feedback
    let level: MatchQuality['level'];
    let feedback: string;
    const improvements: string[] = [];

    if (avgScore >= 80) {
      level = 'excellent';
      feedback =
        'Excellent matches! Your criteria are well-defined and producing high-quality results.';
    } else if (avgScore >= 60) {
      level = 'good';
      feedback =
        'Good matches found. Consider fine-tuning criteria for even better results.';
      if (distribution.excellent < distribution.total * 0.3) {
        improvements.push('Add more specific keywords to improve relevance');
      }
    } else if (avgScore >= 40) {
      level = 'fair';
      feedback = 'Some relevant matches found, but quality could be improved.';
      improvements.push('Review and refine your search criteria');
      improvements.push('Consider adding more specific skills or requirements');
    } else {
      level = 'poor';
      feedback =
        'Few highly relevant matches found. Consider broadening your criteria.';
      improvements.push('Use broader, more general keywords');
      improvements.push('Expand location preferences');
      improvements.push('Consider adjusting salary expectations');
    }

    // Add general improvements based on criteria analysis
    if (!criteria.skills || criteria.skills.length === 0) {
      improvements.push('Add relevant skills to improve matching accuracy');
    }

    if (!criteria.excludeKeywords || criteria.excludeKeywords.length === 0) {
      improvements.push('Use exclude keywords to filter out irrelevant jobs');
    }

    if (jobs.length > 100) {
      improvements.push('Add more specific filters to reduce result volume');
    }

    return {
      score: Math.round(avgScore),
      level,
      feedback,
      distribution,
      improvements: improvements.slice(0, 3), // Limit to top 3 suggestions
    };
  }

  // Generate optimization recommendations
  static generateOptimizationRecommendations(
    criteria: AlertCriteria,
    jobs: JobMatchResult[]
  ): string[] {
    const recommendations: string[] = [];

    if (jobs.length === 0) {
      recommendations.push(
        'Consider removing or broadening location restrictions'
      );
      recommendations.push('Try using broader keywords or job titles');
      if (criteria.salaryMin && criteria.salaryMin > 50000) {
        recommendations.push('Consider lowering minimum salary requirements');
      }
      return recommendations;
    }

    // Analyze job distribution for recommendations
    const avgScore =
      jobs.reduce((sum, job) => sum + job.relevanceScore, 0) / jobs.length;

    if (jobs.length > 50) {
      recommendations.push('Add more specific keywords to narrow results');
      recommendations.push(
        'Consider adding location or experience level filters'
      );
    }

    if (avgScore < 60) {
      recommendations.push('Review keywords for better relevance');
      recommendations.push('Consider adjusting experience level requirements');
    }

    if (!criteria.excludeKeywords || criteria.excludeKeywords.length === 0) {
      recommendations.push(
        'Add exclude keywords to filter out unwanted job types'
      );
    }

    // Skills-based recommendations
    const skillMatchRatio =
      jobs.filter(job => job.matchedFields.includes('skills')).length /
      jobs.length;

    if (
      skillMatchRatio < 0.3 &&
      criteria.skills &&
      criteria.skills.length > 0
    ) {
      recommendations.push(
        'Consider adjusting skill requirements for better matches'
      );
    }

    // Location-based recommendations
    const locationMatchRatio =
      jobs.filter(job => job.matchedFields.includes('location') || job.isRemote)
        .length / jobs.length;

    if (locationMatchRatio < 0.5 && criteria.location) {
      recommendations.push(
        'Consider expanding location search or including remote jobs'
      );
    }

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }
}

// Export the enhanced matching function for backward compatibility
export async function findMatchingJobs(
  criteria: AlertCriteria,
  maxResults: number = 50
): Promise<JobMatchResult[]> {
  return EnhancedJobMatchingService.findMatchingJobs(criteria, maxResults);
}

// Export quality calculation function
export function calculateMatchQuality(
  criteria: AlertCriteria,
  jobs: JobMatchResult[]
): MatchQuality {
  return EnhancedJobMatchingService.calculateMatchQuality(criteria, jobs);
}

// Export recommendations function
export function generateOptimizationRecommendations(
  criteria: AlertCriteria,
  jobs: JobMatchResult[]
): string[] {
  return EnhancedJobMatchingService.generateOptimizationRecommendations(
    criteria,
    jobs
  );
}
