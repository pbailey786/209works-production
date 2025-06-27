// Job Post Learning System
// Analyzes successful job posts to improve Job Genie templates and responses

import { prisma } from '@/lib/database/prisma';
import { openai } from '@/lib/ai';
import { JOB_TEMPLATES, JobTemplate } from './job-knowledge-base';

export interface JobPostAnalysis {
  jobId: string;
  title: string;
  normalizedTitle: string;
  extractedDuties: string[];
  extractedRequirements: string[];
  extractedBenefits: string[];
  salaryRange: {
    min?: number;
    max?: number;
    type: 'hourly' | 'salary' | 'unknown';
  };
  schedule: string;
  location: string;
  applicationCount: number;
  viewCount: number;
  successScore: number; // 0-100 based on views, applications, etc.
  createdAt: Date;
  analyzedAt: Date;
}

export interface LearnedTemplate {
  jobType: string;
  aliases: string[];
  commonDuties: Array<{ text: string; frequency: number }>;
  commonRequirements: Array<{ text: string; frequency: number }>;
  commonBenefits: Array<{ text: string; frequency: number }>;
  salaryInsights: {
    averageMin: number;
    averageMax: number;
    mode: 'hourly' | 'salary';
  };
  schedulePatterns: Array<{ pattern: string; frequency: number }>;
  locationInsights: string[];
  sampleCount: number;
  lastUpdated: Date;
}

export class JobLearningSystem {
  
  /**
   * Analyze a job post to extract patterns and insights
   */
  static async analyzeJobPost(jobId: string): Promise<JobPostAnalysis | null> {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          jobApplications: true,
          _count: {
            select: {
              jobApplications: true
            }
          }
        }
      });

      if (!job) return null;

      // Calculate success score based on engagement
      const viewCount = job.viewCount || 0;
      const applicationCount = job._count.jobApplications;
      const daysLive = Math.max(1, Math.floor((Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Success metrics: views per day, application rate, etc.
      const viewsPerDay = viewCount / daysLive;
      const applicationRate = viewCount > 0 ? (applicationCount / viewCount) * 100 : 0;
      const successScore = Math.min(100, 
        (viewsPerDay * 2) + // 2 points per view per day
        (applicationRate * 10) + // 10 points per % application rate
        (applicationCount * 5) // 5 points per application
      );

      // Extract structured data using AI
      const analysis = await this.extractJobStructure(
        job.title,
        job.description || '',
        job.requirements || '',
        job.benefits || ''
      );

      // Build salary string from salaryMin/salaryMax
      const salaryString = job.salaryMin && job.salaryMax 
        ? `$${job.salaryMin}-${job.salaryMax}`
        : job.salaryMin 
        ? `$${job.salaryMin}+`
        : null;

      return {
        jobId: job.id,
        title: job.title,
        normalizedTitle: this.normalizeJobTitle(job.title),
        extractedDuties: analysis.duties,
        extractedRequirements: analysis.requirements,
        extractedBenefits: analysis.benefits,
        salaryRange: this.parseSalary(salaryString),
        schedule: '', // No schedule field in Job model
        location: job.location,
        applicationCount,
        viewCount,
        successScore,
        createdAt: job.createdAt,
        analyzedAt: new Date()
      };

    } catch (error) {
      console.error('Error analyzing job post:', error);
      return null;
    }
  }

  /**
   * Extract structured information from job description using AI
   */
  private static async extractJobStructure(
    title: string, 
    description: string, 
    requirements: string, 
    benefits: string
  ) {
    const prompt = `Analyze this job posting and extract key information:

Title: ${title}
Description: ${description}
Requirements: ${requirements}
Benefits: ${benefits}

Extract and return JSON with:
{
  "duties": ["duty 1", "duty 2", ...], // Main responsibilities (max 8)
  "requirements": ["req 1", "req 2", ...], // Must-have requirements (max 6)
  "benefits": ["benefit 1", "benefit 2", ...] // Perks/benefits offered (max 5)
}

Focus on specific, actionable items. Remove fluff and generic statements.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert at analyzing job postings. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      
      return {
        duties: parsed.duties || [],
        requirements: parsed.requirements || [],
        benefits: parsed.benefits || []
      };
    } catch (error) {
      console.error('AI extraction failed:', error);
      // Fallback to simple text parsing
      return {
        duties: this.simpleExtractDuties(description),
        requirements: this.simpleExtractRequirements(requirements),
        benefits: this.simpleExtractBenefits(benefits)
      };
    }
  }

  /**
   * Generate or update learned templates from analyzed job posts
   */
  static async updateLearnedTemplates(): Promise<void> {
    try {
      // Get all job analyses from the last 90 days
      const recentAnalyses = await prisma.jobPostAnalysis.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
          },
          successScore: {
            gte: 30 // Only learn from successful posts
          }
        },
        orderBy: { successScore: 'desc' }
      });

      // Group by normalized job title
      const groupedAnalyses = this.groupByJobType(recentAnalyses as any[]);

      for (const [jobType, analyses] of Object.entries(groupedAnalyses)) {
        if (analyses.length >= 3) { // Need at least 3 examples to create a template
          const learnedTemplate = this.generateLearnedTemplate(jobType, analyses);
          await this.saveLearnedTemplate(learnedTemplate);
        }
      }

    } catch (error) {
      console.error('Error updating learned templates:', error);
    }
  }

  /**
   * Get learned insights for a job type to improve Job Genie responses
   */
  static async getJobInsights(jobTitle: string): Promise<LearnedTemplate | null> {
    try {
      const normalizedTitle = this.normalizeJobTitle(jobTitle);
      
      const learned = await prisma.learnedJobTemplate.findFirst({
        where: {
          OR: [
            { jobType: normalizedTitle },
            { aliases: { has: normalizedTitle } }
          ]
        },
        orderBy: { lastUpdated: 'desc' }
      });

      return learned ? JSON.parse(learned.templateData as string) : null;
    } catch (error) {
      console.error('Error getting job insights:', error);
      return null;
    }
  }

  /**
   * Enhance Job Genie response with learned insights
   */
  static async enhanceJobGenieResponse(
    jobTitle: string,
    location: string,
    salary: string,
    baseResponse: any
  ) {
    const insights = await this.getJobInsights(jobTitle);
    const staticTemplate = JOB_TEMPLATES[this.normalizeJobTitle(jobTitle)];

    if (!insights && !staticTemplate) return baseResponse;

    // Merge static template with learned insights
    const enhanced = { ...baseResponse };

    if (insights || staticTemplate) {
      // Use learned data preferentially, fall back to static template
      const duties = insights?.commonDuties?.slice(0, 5).map(d => d.text) || 
                    staticTemplate?.typicalDuties?.slice(0, 5) || [];
      
      const requirements = insights?.commonRequirements?.slice(0, 4).map(r => r.text) ||
                          staticTemplate?.typicalRequirements?.slice(0, 4) || [];
      
      const benefits = insights?.commonBenefits?.slice(0, 3).map(b => b.text) ||
                      staticTemplate?.typicalBenefits?.slice(0, 3) || [];

      if (duties.length > 0 && !enhanced.jobData.description) {
        enhanced.jobData.description = '• ' + duties.join('\n• ');
      }

      if (requirements.length > 0 && !enhanced.jobData.requirements) {
        enhanced.jobData.requirements = '• ' + requirements.join('\n• ');
      }

      if (benefits.length > 0 && !enhanced.jobData.benefits) {
        enhanced.jobData.benefits = benefits.join(', ');
      }

      // Add salary insights if none provided
      if (!enhanced.jobData.salary && insights?.salaryInsights) {
        const { averageMin, averageMax, mode } = insights.salaryInsights;
        enhanced.jobData.salary = `$${averageMin}-${averageMax}/${mode === 'hourly' ? 'hour' : 'year'}`;
      }
    }

    return enhanced;
  }

  // Helper methods
  private static normalizeJobTitle(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static parseSalary(salaryText: string | null): JobPostAnalysis['salaryRange'] {
    if (!salaryText) return { type: 'unknown' };

    const hourlyMatch = salaryText.match(/\$?(\d+(?:\.\d+)?)\s*-?\s*\$?(\d+(?:\.\d+)?)?\s*(?:per\s+hour|\/hour|hourly|hr)/i);
    if (hourlyMatch) {
      return {
        min: parseFloat(hourlyMatch[1]),
        max: hourlyMatch[2] ? parseFloat(hourlyMatch[2]) : undefined,
        type: 'hourly'
      };
    }

    const salaryMatch = salaryText.match(/\$?(\d+(?:,\d+)?(?:\.\d+)?)\s*-?\s*\$?(\d+(?:,\d+)?(?:\.\d+)?)?\s*(?:per\s+year|annually|salary)/i);
    if (salaryMatch) {
      return {
        min: parseFloat(salaryMatch[1].replace(/,/g, '')),
        max: salaryMatch[2] ? parseFloat(salaryMatch[2].replace(/,/g, '')) : undefined,
        type: 'salary'
      };
    }

    return { type: 'unknown' };
  }

  private static groupByJobType(analyses: any[]): Record<string, any[]> {
    return analyses.reduce((groups, analysis) => {
      const jobType = analysis.normalizedTitle;
      if (!groups[jobType]) groups[jobType] = [];
      groups[jobType].push(analysis);
      return groups;
    }, {});
  }

  private static generateLearnedTemplate(jobType: string, analyses: any[]): LearnedTemplate {
    // Aggregate patterns from successful job posts
    const allDuties = analyses.flatMap(a => a.extractedDuties);
    const allRequirements = analyses.flatMap(a => a.extractedRequirements);
    const allBenefits = analyses.flatMap(a => a.extractedBenefits);
    const salaries = analyses.map(a => a.salaryRange).filter(s => s.min);

    return {
      jobType,
      aliases: [jobType], // Could expand this by analyzing similar titles
      commonDuties: this.getFrequencyMap(allDuties).slice(0, 8),
      commonRequirements: this.getFrequencyMap(allRequirements).slice(0, 6),
      commonBenefits: this.getFrequencyMap(allBenefits).slice(0, 5),
      salaryInsights: {
        averageMin: Math.round(salaries.reduce((sum, s) => sum + (s.min || 0), 0) / salaries.length),
        averageMax: Math.round(salaries.reduce((sum, s) => sum + (s.max || s.min || 0), 0) / salaries.length),
        mode: salaries[0]?.type === 'hourly' ? 'hourly' : 'salary'
      },
      schedulePatterns: this.getFrequencyMap(analyses.map((a: any) => a.schedule).filter(Boolean)).map(item => ({ pattern: item.text, frequency: item.frequency })),
      locationInsights: [...new Set(analyses.map(a => a.location))],
      sampleCount: analyses.length,
      lastUpdated: new Date()
    };
  }

  private static getFrequencyMap(items: string[]): Array<{ text: string; frequency: number }> {
    const freq: Record<string, number> = {};
    items.forEach(item => {
      const normalized = item.toLowerCase().trim();
      freq[normalized] = (freq[normalized] || 0) + 1;
    });

    return Object.entries(freq)
      .map(([text, frequency]) => ({ text, frequency }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  private static async saveLearnedTemplate(template: LearnedTemplate): Promise<void> {
    await prisma.learnedJobTemplate.upsert({
      where: { jobType: template.jobType },
      update: {
        templateData: JSON.stringify(template),
        lastUpdated: new Date()
      },
      create: {
        jobType: template.jobType,
        aliases: template.aliases,
        templateData: JSON.stringify(template),
        lastUpdated: new Date()
      }
    });
  }

  // Fallback text parsing methods
  private static simpleExtractDuties(text: string): string[] {
    const duties: string[] = [];
    const lines = text.split('\n').map(l => l.trim());
    
    for (const line of lines) {
      if (line.match(/^[•\-\*]\s*(.+)/) || line.match(/^\d+\.\s*(.+)/)) {
        duties.push(line.replace(/^[•\-\*\d\.\s]+/, ''));
      }
    }
    
    return duties.slice(0, 8);
  }

  private static simpleExtractRequirements(text: string): string[] {
    const reqs: string[] = [];
    const lines = text.split('\n').map(l => l.trim());
    
    for (const line of lines) {
      if (line.match(/^[•\-\*]\s*(.+)/) || line.match(/^\d+\.\s*(.+)/)) {
        reqs.push(line.replace(/^[•\-\*\d\.\s]+/, ''));
      }
    }
    
    return reqs.slice(0, 6);
  }

  private static simpleExtractBenefits(text: string): string[] {
    const benefits: string[] = [];
    const lines = text.split('\n').map(l => l.trim());
    
    for (const line of lines) {
      if (line.match(/^[•\-\*]\s*(.+)/) || line.match(/^\d+\.\s*(.+)/)) {
        benefits.push(line.replace(/^[•\-\*\d\.\s]+/, ''));
      }
    }
    
    return benefits.slice(0, 5);
  }
}

// Background job to analyze posts and update templates
export async function runJobLearningPipeline() {
  console.log('Starting job learning pipeline...');
  
  try {
    // Analyze recent job posts that haven't been analyzed yet
    const unanalyzedJobs = await prisma.job.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        },
        // Add condition to exclude already analyzed posts
        id: {
          notIn: await prisma.jobPostAnalysis.findMany({
            select: { jobId: true }
          }).then(analyses => analyses.map(a => a.jobId))
        }
      },
      take: 50 // Process 50 at a time
    });

    console.log(`Analyzing ${unanalyzedJobs.length} new job posts...`);

    for (const job of unanalyzedJobs) {
      const analysis = await JobLearningSystem.analyzeJobPost(job.id);
      if (analysis) {
        // Save analysis to database
        await prisma.jobPostAnalysis.create({
          data: {
            jobId: analysis.jobId,
            title: analysis.title,
            normalizedTitle: analysis.normalizedTitle,
            extractedData: JSON.stringify({
              duties: analysis.extractedDuties,
              requirements: analysis.extractedRequirements,
              benefits: analysis.extractedBenefits
            }),
            salaryData: JSON.stringify(analysis.salaryRange),
            schedule: analysis.schedule,
            location: analysis.location,
            applicationCount: analysis.applicationCount,
            viewCount: analysis.viewCount,
            successScore: analysis.successScore,
            originalCreatedAt: analysis.createdAt
          }
        });
      }
    }

    // Update learned templates
    await JobLearningSystem.updateLearnedTemplates();
    
    console.log('Job learning pipeline completed successfully');
  } catch (error) {
    console.error('Job learning pipeline failed:', error);
  }
}