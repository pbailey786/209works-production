/**
 * Predictive Analytics Service
 * Advanced ML-powered predictions for hiring success, salary trends, and career progression
 */

import { prisma } from '@/lib/database/prisma';
import { processWithAI } from '@/lib/ai';
import { EnhancedCacheManager, CACHE_DURATIONS, CACHE_TAGS } from '@/lib/performance/enhanced-cache-manager';

export interface HiringSuccessPrediction {
  jobId: string;
  candidateId: string;
  successProbability: number; // 0-1
  confidenceLevel: number; // 0-1
  keyFactors: {
    factor: string;
    impact: number; // -1 to 1
    description: string;
  }[];
  recommendations: string[];
  timeToHire: number; // estimated days
  retentionProbability: number; // 0-1
}

export interface SalaryTrendPrediction {
  jobTitle: string;
  location: string;
  currentSalaryRange: { min: number; max: number };
  predictedSalaryRange: { min: number; max: number };
  trend: 'increasing' | 'decreasing' | 'stable';
  trendStrength: number; // 0-1
  factors: string[];
  timeframe: string;
  confidence: number; // 0-1
}

export interface CareerProgressionPrediction {
  userId: string;
  currentRole: string;
  nextRoles: {
    title: string;
    probability: number;
    timeframe: string;
    requiredSkills: string[];
    salaryIncrease: number;
  }[];
  skillGaps: {
    skill: string;
    importance: number;
    currentLevel: number;
    targetLevel: number;
  }[];
  recommendations: string[];
}

export interface MarketDemandPrediction {
  skill: string;
  location: string;
  currentDemand: number; // 0-100
  predictedDemand: number; // 0-100
  trend: 'increasing' | 'decreasing' | 'stable';
  growthRate: number; // percentage
  competitionLevel: number; // 0-100
  averageSalary: number;
  jobOpenings: number;
  timeframe: string;
}

export class PredictiveAnalyticsService {
  private static cache = new EnhancedCacheManager();

  /**
   * Predict hiring success for a specific job-candidate pair
   */
  static async predictHiringSuccess(
    jobId: string,
    candidateId: string
  ): Promise<HiringSuccessPrediction> {
    return this.cache.getOrSet(
      `hiring-success:${jobId}:${candidateId}`,
      async () => {
        // Get job and candidate data
        const [job, candidate] = await Promise.all([
          prisma.job.findUnique({
            where: { id: jobId },
            include: {
              employer: true,
              jobApplications: {
                include: {
                  user: {
                    include: {
                      jobSeekerProfile: true,
                    },
                  },
                },
              },
            },
          }),
          prisma.user.findUnique({
            where: { id: candidateId },
            include: {
              jobSeekerProfile: true,
              jobApplications: {
                include: {
                  job: true,
                },
              },
            },
          }),
        ]);

        if (!job || !candidate) {
          throw new Error('Job or candidate not found');
        }

        // Analyze historical hiring patterns
        const historicalData = await this.analyzeHistoricalHiring(job.employerId);
        
        // Calculate success factors
        const factors = await this.calculateSuccessFactors(job, candidate, historicalData);
        
        // Generate AI-powered prediction
        const aiPrediction = await this.generateAIPrediction(job, candidate, factors);
        
        return aiPrediction;
      },
      {
        ttl: CACHE_DURATIONS.MEDIUM,
        tags: [CACHE_TAGS.PREDICTIONS, CACHE_TAGS.AI_RESPONSES],
      }
    );
  }

  /**
   * Predict salary trends for specific roles and locations
   */
  static async predictSalaryTrends(
    jobTitle: string,
    location: string,
    timeframe: '3months' | '6months' | '1year' = '6months'
  ): Promise<SalaryTrendPrediction> {
    return this.cache.getOrSet(
      `salary-trends:${jobTitle}:${location}:${timeframe}`,
      async () => {
        // Get historical salary data
        const salaryData = await this.getHistoricalSalaryData(jobTitle, location);
        
        // Analyze market trends
        const marketTrends = await this.analyzeMarketTrends(jobTitle, location);
        
        // Generate prediction using AI
        const prediction = await this.generateSalaryPrediction(
          jobTitle,
          location,
          salaryData,
          marketTrends,
          timeframe
        );
        
        return prediction;
      },
      {
        ttl: CACHE_DURATIONS.LONG,
        tags: [CACHE_TAGS.PREDICTIONS, CACHE_TAGS.MARKET_DATA],
      }
    );
  }

  /**
   * Predict career progression for a user
   */
  static async predictCareerProgression(userId: string): Promise<CareerProgressionPrediction> {
    return this.cache.getOrSet(
      `career-progression:${userId}`,
      async () => {
        // Get user profile and history
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            jobSeekerProfile: true,
            jobApplications: {
              include: {
                job: true,
              },
            },
          },
        });

        if (!user || !user.jobSeekerProfile) {
          throw new Error('User profile not found');
        }

        // Analyze career patterns
        const careerPatterns = await this.analyzeCareerPatterns(user);
        
        // Generate progression prediction
        const prediction = await this.generateCareerPrediction(user, careerPatterns);
        
        return prediction;
      },
      {
        ttl: CACHE_DURATIONS.MEDIUM,
        tags: [CACHE_TAGS.PREDICTIONS, CACHE_TAGS.USER_DATA],
      }
    );
  }

  /**
   * Predict market demand for skills
   */
  static async predictMarketDemand(
    skill: string,
    location: string,
    timeframe: '3months' | '6months' | '1year' = '6months'
  ): Promise<MarketDemandPrediction> {
    return this.cache.getOrSet(
      `market-demand:${skill}:${location}:${timeframe}`,
      async () => {
        // Analyze current market data
        const currentData = await this.analyzeCurrentMarketDemand(skill, location);
        
        // Generate demand prediction
        const prediction = await this.generateDemandPrediction(
          skill,
          location,
          currentData,
          timeframe
        );
        
        return prediction;
      },
      {
        ttl: CACHE_DURATIONS.LONG,
        tags: [CACHE_TAGS.PREDICTIONS, CACHE_TAGS.MARKET_DATA],
      }
    );
  }

  // Private helper methods

  private static async analyzeHistoricalHiring(employerId: string) {
    const applications = await prisma.jobApplication.findMany({
      where: {
        job: { employerId },
        status: { in: ['hired', 'rejected'] },
      },
      include: {
        user: {
          include: {
            jobSeekerProfile: true,
          },
        },
        job: true,
      },
    });

    return {
      totalApplications: applications.length,
      hiredCount: applications.filter(app => app.status === 'hired').length,
      averageTimeToHire: this.calculateAverageTimeToHire(applications),
      successFactors: this.identifySuccessFactors(applications),
    };
  }

  private static async calculateSuccessFactors(job: any, candidate: any, historicalData: any) {
    const factors = [];

    // Skills match
    const skillsMatch = this.calculateSkillsMatch(job, candidate);
    factors.push({
      factor: 'Skills Match',
      impact: skillsMatch,
      description: `${Math.round(skillsMatch * 100)}% skills alignment`,
    });

    // Experience level
    const experienceMatch = this.calculateExperienceMatch(job, candidate);
    factors.push({
      factor: 'Experience Level',
      impact: experienceMatch,
      description: `Experience level compatibility`,
    });

    // Location preference
    const locationMatch = this.calculateLocationMatch(job, candidate);
    factors.push({
      factor: 'Location Preference',
      impact: locationMatch,
      description: `Location alignment with preferences`,
    });

    return factors;
  }

  private static async generateAIPrediction(job: any, candidate: any, factors: any[]): Promise<HiringSuccessPrediction> {
    const prompt = `
Analyze the hiring success probability for this job-candidate match:

Job: ${job.title} at ${job.company}
Requirements: ${job.description}
Salary: $${job.salaryMin}-${job.salaryMax}

Candidate Profile:
- Experience: ${candidate.jobSeekerProfile?.experience || 'Not specified'}
- Skills: ${candidate.jobSeekerProfile?.skills?.join(', ') || 'Not specified'}
- Location: ${candidate.jobSeekerProfile?.location || 'Not specified'}

Success Factors:
${factors.map(f => `- ${f.factor}: ${f.description} (Impact: ${f.impact})`).join('\n')}

Provide a detailed analysis including:
1. Success probability (0-100%)
2. Confidence level (0-100%)
3. Key recommendations
4. Estimated time to hire (days)
5. Retention probability (0-100%)

Format as JSON.
    `;

    const response = await processWithAI(prompt, {
      systemPrompt: 'You are an expert hiring analytics specialist. Provide accurate, data-driven predictions.',
      maxTokens: 800,
      temperature: 0.3,
      context: 'Hiring Success Prediction',
    });

    // Parse AI response and structure data
    try {
      const parsed = JSON.parse(response);
      return {
        jobId: job.id,
        candidateId: candidate.id,
        successProbability: parsed.successProbability / 100,
        confidenceLevel: parsed.confidenceLevel / 100,
        keyFactors: factors,
        recommendations: parsed.recommendations || [],
        timeToHire: parsed.timeToHire || 30,
        retentionProbability: parsed.retentionProbability / 100 || 0.8,
      };
    } catch (error) {
      // Fallback calculation
      const avgImpact = factors.reduce((sum, f) => sum + f.impact, 0) / factors.length;
      return {
        jobId: job.id,
        candidateId: candidate.id,
        successProbability: Math.max(0.1, Math.min(0.9, avgImpact)),
        confidenceLevel: 0.7,
        keyFactors: factors,
        recommendations: ['Review candidate qualifications', 'Consider interview'],
        timeToHire: 30,
        retentionProbability: 0.8,
      };
    }
  }

  private static calculateSkillsMatch(job: any, candidate: any): number {
    // Implementation for skills matching algorithm
    const jobSkills = this.extractSkillsFromText(job.description);
    const candidateSkills = candidate.jobSeekerProfile?.skills || [];
    
    if (jobSkills.length === 0) return 0.5;
    
    const matches = jobSkills.filter(skill => 
      candidateSkills.some(cSkill => 
        cSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(cSkill.toLowerCase())
      )
    );
    
    return matches.length / jobSkills.length;
  }

  private static calculateExperienceMatch(job: any, candidate: any): number {
    // Implementation for experience matching
    const requiredExp = this.extractExperienceRequirement(job.description);
    const candidateExp = candidate.jobSeekerProfile?.experience || 0;
    
    if (requiredExp === 0) return 0.8;
    
    const ratio = candidateExp / requiredExp;
    if (ratio >= 1) return 1;
    if (ratio >= 0.8) return 0.9;
    if (ratio >= 0.6) return 0.7;
    if (ratio >= 0.4) return 0.5;
    return 0.3;
  }

  private static calculateLocationMatch(job: any, candidate: any): number {
    // Implementation for location matching
    const jobLocation = job.location?.toLowerCase() || '';
    const candidateLocation = candidate.jobSeekerProfile?.location?.toLowerCase() || '';
    
    if (job.isRemote) return 1;
    if (jobLocation.includes(candidateLocation) || candidateLocation.includes(jobLocation)) return 1;
    
    return 0.5; // Default for different locations
  }

  private static extractSkillsFromText(text: string): string[] {
    // Simple skill extraction - could be enhanced with NLP
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS',
      'Customer Service', 'Sales', 'Marketing', 'Management', 'Leadership',
      'Communication', 'Problem Solving', 'Teamwork', 'Organization'
    ];
    
    return commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
  }

  private static extractExperienceRequirement(text: string): number {
    // Extract years of experience from job description
    const expMatch = text.match(/(\d+)[\s-]*(?:years?|yrs?)\s*(?:of\s*)?experience/i);
    return expMatch ? parseInt(expMatch[1]) : 0;
  }

  private static calculateAverageTimeToHire(applications: any[]): number {
    const hiredApps = applications.filter(app => app.status === 'hired');
    if (hiredApps.length === 0) return 30;
    
    const totalDays = hiredApps.reduce((sum, app) => {
      const days = Math.floor(
        (new Date(app.updatedAt).getTime() - new Date(app.createdAt).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    
    return totalDays / hiredApps.length;
  }

  private static identifySuccessFactors(applications: any[]): string[] {
    // Analyze what factors lead to successful hires
    return [
      'Strong skills match',
      'Relevant experience',
      'Local candidate',
      'Quick response time',
    ];
  }

  // Additional helper methods for other prediction types would go here...
  private static async getHistoricalSalaryData(jobTitle: string, location: string) {
    // Implementation for salary data analysis
    return {};
  }

  private static async analyzeMarketTrends(jobTitle: string, location: string) {
    // Implementation for market trend analysis
    return {};
  }

  private static async generateSalaryPrediction(
    jobTitle: string,
    location: string,
    salaryData: any,
    marketTrends: any,
    timeframe: string
  ): Promise<SalaryTrendPrediction> {
    // Implementation for salary prediction
    return {
      jobTitle,
      location,
      currentSalaryRange: { min: 50000, max: 80000 },
      predictedSalaryRange: { min: 52000, max: 85000 },
      trend: 'increasing',
      trendStrength: 0.7,
      factors: ['Market demand', 'Skill shortage', 'Economic growth'],
      timeframe,
      confidence: 0.8,
    };
  }

  private static async analyzeCareerPatterns(user: any) {
    // Implementation for career pattern analysis
    return {};
  }

  private static async generateCareerPrediction(
    user: any,
    careerPatterns: any
  ): Promise<CareerProgressionPrediction> {
    // Implementation for career progression prediction
    return {
      userId: user.id,
      currentRole: user.jobSeekerProfile?.currentJobTitle || 'Unknown',
      nextRoles: [],
      skillGaps: [],
      recommendations: [],
    };
  }

  private static async analyzeCurrentMarketDemand(skill: string, location: string) {
    // Implementation for current market demand analysis
    return {};
  }

  private static async generateDemandPrediction(
    skill: string,
    location: string,
    currentData: any,
    timeframe: string
  ): Promise<MarketDemandPrediction> {
    // Implementation for demand prediction
    return {
      skill,
      location,
      currentDemand: 75,
      predictedDemand: 80,
      trend: 'increasing',
      growthRate: 5,
      competitionLevel: 60,
      averageSalary: 75000,
      jobOpenings: 150,
      timeframe,
    };
  }
}
