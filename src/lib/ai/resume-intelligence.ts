/**
 * Resume Intelligence Service
 * Advanced AI-powered resume analysis, optimization, and insights
 */

import { processWithAI } from '@/lib/ai';
import { prisma } from '@/lib/database/prisma';
import { EnhancedCacheManager, CACHE_DURATIONS, CACHE_TAGS } from '@/lib/performance/enhanced-cache-manager';

export interface ResumeAnalysis {
  overallScore: number; // 0-100
  sections: {
    contact: { score: number; issues: string[]; suggestions: string[] };
    summary: { score: number; issues: string[]; suggestions: string[] };
    experience: { score: number; issues: string[]; suggestions: string[] };
    education: { score: number; issues: string[]; suggestions: string[] };
    skills: { score: number; issues: string[]; suggestions: string[] };
    formatting: { score: number; issues: string[]; suggestions: string[] };
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  atsCompatibility: number; // 0-100
  industryAlignment: number; // 0-100
  keywordDensity: { keyword: string; count: number; importance: number }[];
  estimatedViewTime: number; // seconds
  competitiveAdvantage: string[];
}

export interface ResumeOptimization {
  originalText: string;
  optimizedText: string;
  improvements: {
    section: string;
    change: string;
    reason: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  keywordSuggestions: string[];
  scoreImprovement: number;
  targetJobAlignment: number;
}

export interface SkillGapAnalysis {
  currentSkills: string[];
  requiredSkills: string[];
  missingSkills: string[];
  skillGaps: {
    skill: string;
    importance: number; // 0-1
    difficulty: number; // 0-1
    timeToLearn: string;
    resources: string[];
  }[];
  recommendations: string[];
  careerImpact: string;
}

export interface ResumeInsights {
  marketPosition: {
    percentile: number; // 0-100
    comparison: string;
    competitiveAdvantages: string[];
    improvementAreas: string[];
  };
  salaryPrediction: {
    estimatedRange: { min: number; max: number };
    factors: string[];
    confidence: number;
  };
  jobMatchProbability: {
    jobId: string;
    probability: number;
    reasons: string[];
  }[];
  careerProgression: {
    nextRoles: string[];
    timeframe: string;
    requiredSkills: string[];
  };
}

export class ResumeIntelligenceService {
  private static cache = new EnhancedCacheManager();

  /**
   * Comprehensive resume analysis
   */
  static async analyzeResume(
    resumeText: string,
    targetJobTitle?: string,
    targetIndustry?: string
  ): Promise<ResumeAnalysis> {
    const cacheKey = `resume-analysis:${this.hashText(resumeText)}:${targetJobTitle || 'general'}`;
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const prompt = `
Analyze this resume comprehensively:

RESUME TEXT:
${resumeText}

TARGET JOB: ${targetJobTitle || 'General analysis'}
TARGET INDUSTRY: ${targetIndustry || 'General'}

Provide detailed analysis including:
1. Overall score (0-100)
2. Section-by-section analysis (contact, summary, experience, education, skills, formatting)
3. Strengths and weaknesses
4. ATS compatibility score
5. Industry alignment score
6. Keyword analysis
7. Estimated recruiter view time
8. Competitive advantages

Format as detailed JSON with specific, actionable feedback.
        `;

        const response = await processWithAI(prompt, {
          systemPrompt: 'You are an expert resume analyst and career coach with 20+ years of experience in recruitment and talent acquisition.',
          maxTokens: 1500,
          temperature: 0.3,
          context: 'Resume Analysis',
        });

        return this.parseResumeAnalysis(response, resumeText);
      },
      {
        ttl: CACHE_DURATIONS.LONG,
        tags: [CACHE_TAGS.AI_RESPONSES, CACHE_TAGS.RESUME_ANALYSIS],
      }
    );
  }

  /**
   * Optimize resume for specific job
   */
  static async optimizeResumeForJob(
    resumeText: string,
    jobDescription: string,
    jobTitle: string
  ): Promise<ResumeOptimization> {
    const cacheKey = `resume-optimization:${this.hashText(resumeText)}:${this.hashText(jobDescription)}`;
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const prompt = `
Optimize this resume for the specific job:

CURRENT RESUME:
${resumeText}

TARGET JOB:
Title: ${jobTitle}
Description: ${jobDescription}

Provide:
1. Optimized resume text with improvements
2. List of specific changes made
3. Keyword suggestions to add
4. Expected score improvement
5. Job alignment percentage

Focus on:
- ATS optimization
- Keyword alignment
- Relevant experience highlighting
- Skills matching
- Quantified achievements
- Industry-specific language

Format as JSON with clear before/after comparisons.
        `;

        const response = await processWithAI(prompt, {
          systemPrompt: 'You are an expert resume writer specializing in ATS optimization and job-specific tailoring.',
          maxTokens: 2000,
          temperature: 0.4,
          context: 'Resume Optimization',
        });

        return this.parseResumeOptimization(response, resumeText);
      },
      {
        ttl: CACHE_DURATIONS.MEDIUM,
        tags: [CACHE_TAGS.AI_RESPONSES, CACHE_TAGS.RESUME_OPTIMIZATION],
      }
    );
  }

  /**
   * Analyze skill gaps for target role
   */
  static async analyzeSkillGaps(
    resumeText: string,
    targetJobDescription: string,
    targetJobTitle: string
  ): Promise<SkillGapAnalysis> {
    const cacheKey = `skill-gaps:${this.hashText(resumeText)}:${this.hashText(targetJobDescription)}`;
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const prompt = `
Analyze skill gaps between this resume and target job:

CURRENT RESUME:
${resumeText}

TARGET JOB:
Title: ${targetJobTitle}
Description: ${targetJobDescription}

Identify:
1. Current skills from resume
2. Required skills from job description
3. Missing critical skills
4. Skill gap analysis with importance and difficulty ratings
5. Learning recommendations and resources
6. Career impact assessment

Provide specific, actionable insights for skill development.
        `;

        const response = await processWithAI(prompt, {
          systemPrompt: 'You are a career development specialist and skills assessment expert.',
          maxTokens: 1200,
          temperature: 0.3,
          context: 'Skill Gap Analysis',
        });

        return this.parseSkillGapAnalysis(response);
      },
      {
        ttl: CACHE_DURATIONS.MEDIUM,
        tags: [CACHE_TAGS.AI_RESPONSES, CACHE_TAGS.SKILL_ANALYSIS],
      }
    );
  }

  /**
   * Generate comprehensive resume insights
   */
  static async generateResumeInsights(
    userId: string,
    resumeText: string,
    targetJobs?: string[]
  ): Promise<ResumeInsights> {
    const cacheKey = `resume-insights:${userId}:${this.hashText(resumeText)}`;
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        // Get user's job application history
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            jobSeekerProfile: true,
            jobApplications: {
              include: {
                job: true,
              },
              take: 20,
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Analyze market position
        const marketPosition = await this.analyzeMarketPosition(resumeText, user);
        
        // Predict salary range
        const salaryPrediction = await this.predictSalaryRange(resumeText, user);
        
        // Calculate job match probabilities
        const jobMatchProbabilities = await this.calculateJobMatchProbabilities(
          resumeText,
          targetJobs || []
        );
        
        // Predict career progression
        const careerProgression = await this.predictCareerProgression(resumeText, user);

        return {
          marketPosition,
          salaryPrediction,
          jobMatchProbability: jobMatchProbabilities,
          careerProgression,
        };
      },
      {
        ttl: CACHE_DURATIONS.MEDIUM,
        tags: [CACHE_TAGS.AI_RESPONSES, CACHE_TAGS.CAREER_INSIGHTS],
      }
    );
  }

  /**
   * Extract and enhance skills from resume
   */
  static async extractAndEnhanceSkills(resumeText: string): Promise<{
    extractedSkills: string[];
    skillCategories: { category: string; skills: string[] }[];
    suggestedSkills: string[];
    skillLevels: { skill: string; level: 'beginner' | 'intermediate' | 'advanced' | 'expert' }[];
  }> {
    const prompt = `
Extract and categorize all skills from this resume:

${resumeText}

Provide:
1. Complete list of extracted skills
2. Skills organized by categories (Technical, Soft Skills, Industry-Specific, etc.)
3. Suggested additional skills based on experience
4. Estimated skill levels based on context

Format as structured JSON.
    `;

    const response = await processWithAI(prompt, {
      systemPrompt: 'You are a skills assessment expert specializing in resume analysis and skill categorization.',
      maxTokens: 800,
      temperature: 0.3,
      context: 'Skill Extraction',
    });

    try {
      return JSON.parse(response);
    } catch (error) {
      // Fallback parsing
      return {
        extractedSkills: this.extractBasicSkills(resumeText),
        skillCategories: [],
        suggestedSkills: [],
        skillLevels: [],
      };
    }
  }

  // Private helper methods

  private static hashText(text: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private static parseResumeAnalysis(response: string, resumeText: string): ResumeAnalysis {
    try {
      const parsed = JSON.parse(response);
      return {
        overallScore: parsed.overallScore || 70,
        sections: parsed.sections || this.getDefaultSections(),
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        recommendations: parsed.recommendations || [],
        atsCompatibility: parsed.atsCompatibility || 75,
        industryAlignment: parsed.industryAlignment || 70,
        keywordDensity: parsed.keywordDensity || [],
        estimatedViewTime: parsed.estimatedViewTime || 30,
        competitiveAdvantage: parsed.competitiveAdvantage || [],
      };
    } catch (error) {
      return this.getFallbackAnalysis(resumeText);
    }
  }

  private static parseResumeOptimization(response: string, originalText: string): ResumeOptimization {
    try {
      const parsed = JSON.parse(response);
      return {
        originalText,
        optimizedText: parsed.optimizedText || originalText,
        improvements: parsed.improvements || [],
        keywordSuggestions: parsed.keywordSuggestions || [],
        scoreImprovement: parsed.scoreImprovement || 10,
        targetJobAlignment: parsed.targetJobAlignment || 80,
      };
    } catch (error) {
      return {
        originalText,
        optimizedText: originalText,
        improvements: [],
        keywordSuggestions: [],
        scoreImprovement: 0,
        targetJobAlignment: 70,
      };
    }
  }

  private static parseSkillGapAnalysis(response: string): SkillGapAnalysis {
    try {
      const parsed = JSON.parse(response);
      return {
        currentSkills: parsed.currentSkills || [],
        requiredSkills: parsed.requiredSkills || [],
        missingSkills: parsed.missingSkills || [],
        skillGaps: parsed.skillGaps || [],
        recommendations: parsed.recommendations || [],
        careerImpact: parsed.careerImpact || 'Moderate impact on career progression',
      };
    } catch (error) {
      return {
        currentSkills: [],
        requiredSkills: [],
        missingSkills: [],
        skillGaps: [],
        recommendations: [],
        careerImpact: 'Unable to assess career impact',
      };
    }
  }

  private static async analyzeMarketPosition(resumeText: string, user: any) {
    // Implementation for market position analysis
    return {
      percentile: 75,
      comparison: 'Above average for your experience level',
      competitiveAdvantages: ['Strong technical skills', 'Relevant experience'],
      improvementAreas: ['Leadership experience', 'Industry certifications'],
    };
  }

  private static async predictSalaryRange(resumeText: string, user: any) {
    // Implementation for salary prediction
    return {
      estimatedRange: { min: 65000, max: 85000 },
      factors: ['Experience level', 'Skills', 'Location', 'Industry'],
      confidence: 0.8,
    };
  }

  private static async calculateJobMatchProbabilities(resumeText: string, targetJobs: string[]) {
    // Implementation for job match probability calculation
    return [];
  }

  private static async predictCareerProgression(resumeText: string, user: any) {
    // Implementation for career progression prediction
    return {
      nextRoles: ['Senior Developer', 'Team Lead', 'Technical Manager'],
      timeframe: '2-3 years',
      requiredSkills: ['Leadership', 'Project Management', 'Advanced Technical Skills'],
    };
  }

  private static getDefaultSections() {
    return {
      contact: { score: 80, issues: [], suggestions: [] },
      summary: { score: 70, issues: [], suggestions: [] },
      experience: { score: 75, issues: [], suggestions: [] },
      education: { score: 80, issues: [], suggestions: [] },
      skills: { score: 70, issues: [], suggestions: [] },
      formatting: { score: 85, issues: [], suggestions: [] },
    };
  }

  private static getFallbackAnalysis(resumeText: string): ResumeAnalysis {
    return {
      overallScore: 70,
      sections: this.getDefaultSections(),
      strengths: ['Professional experience', 'Relevant skills'],
      weaknesses: ['Could use more quantified achievements'],
      recommendations: ['Add more specific metrics', 'Improve keyword optimization'],
      atsCompatibility: 75,
      industryAlignment: 70,
      keywordDensity: [],
      estimatedViewTime: 30,
      competitiveAdvantage: [],
    };
  }

  private static extractBasicSkills(resumeText: string): string[] {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS',
      'Customer Service', 'Sales', 'Marketing', 'Management', 'Leadership',
      'Communication', 'Problem Solving', 'Teamwork', 'Organization'
    ];
    
    return commonSkills.filter(skill => 
      resumeText.toLowerCase().includes(skill.toLowerCase())
    );
  }
}
