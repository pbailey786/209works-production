import { prisma } from '@/lib/database/prisma';
import { ResumeEmbeddingService } from '@/components/ui/card';
import { FeaturedJobAnalyticsService } from './featured-job-analytics';
import path from "path";

export interface JobMatchResult {
  userId: string;
  score: number;
  matchReason: string[];
  user: {
    id: string;
    name: string | null;
    email: string;
    location: string | null;
  };
}

export interface MatchingStats {
  totalCandidates: number;
  highScoreMatches: number;
  emailsSent: number;
  averageScore: number;
  topScore: number;
}

export class JobMatchingService {
  private static readonly MIN_SCORE_THRESHOLD = 80.0;
  private static readonly HIGH_SCORE_THRESHOLD = 90.0;

  /**
   * Find matching candidates for a featured job
   */
  static async findMatchingCandidates(jobId: string): Promise<{
    matches: JobMatchResult[];
    stats: MatchingStats;
  }> {
    try {
      console.log(`🔍 Finding matching candidates for job: ${jobId}`);

      // Get the job details
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          title: true,
          description: true,
          company: true,
          location: true,
          skills: true,
          featured: true,
          jobType: true
        }
      });

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (!job.featured) {
        throw new Error(`Job ${jobId} is not featured`);
      }

      // Generate job embedding
      const jobEmbedding = await ResumeEmbeddingService.generateJobEmbedding(
        `${job.title} ${job.description} ${job.skills.path.join(' ')}`
      );

      // Get eligible candidates (opted in, active in last 30 days, have embeddings)
      const candidates = await this.getEligibleCandidates();
      console.log(`📊 Found ${candidates.length} eligible candidates`);

      const matches: JobMatchResult[] = [];
      let totalScore = 0;
      let topScore = 0;

      // Calculate similarity scores for each candidate
      for (const candidate of candidates) {
        try {
          const resumeEmbedding = JSON.parse(candidate.embedding);
          const score = ResumeEmbeddingService.calculateCosineSimilarity(
            jobEmbedding,
            resumeEmbedding
          );

          totalScore += score;
          topScore = Math.max(topScore, score);

          // Generate match reasons
          const matchReason = this.generateMatchReasons(job, candidate, score);

          matches.push({
            userId: candidate.userId,
            score,
            matchReason,
            user: {
              id: candidate.userId,
              name: candidate.user.name,
              email: candidate.user.email,
              location: candidate.user.location
            }
          });
        } catch (error) {
          console.error(`Failed to process candidate ${candidate.userId}:`, error);
        }
      }

      // Sort by score descending
      matches.sort((a, b) => b.score - a.score);

      const stats: MatchingStats = {
        totalCandidates: candidates.length,
        highScoreMatches: matches.filter(m => m.score >= this.HIGH_SCORE_THRESHOLD).length,
        emailsSent: 0, // Will be updated when emails are sent
        averageScore: candidates.length > 0 ? totalScore / candidates.length : 0,
        topScore
      };

      console.log(`✅ Matching complete. Top matches: ${matches.filter(m => m.score >= this.MIN_SCORE_THRESHOLD).length}`);

      return { matches, stats };
    } catch (error) {
      console.error(`❌ Failed to find matching candidates for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get eligible candidates for job matching
   */
  private static async getEligibleCandidates() {
    return await prisma.resumeEmbedding.findMany({
      where: {
        user: {
          role: 'jobseeker',
          isActive: true,
          deletedAt: null,
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          },
          jobSeekerProfile: {
            optInEmailAlerts: true
          }
        },
        // Only include embeddings that are relatively fresh (last 60 days)
        lastJobProcessed: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        userId: true,
        embedding: true,
        skills: true,
        jobTitles: true,
        industries: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            location: true,
            lastLoginAt: true
          }
        }
      },
      orderBy: {
        user: {
          lastLoginAt: 'desc'
        }
      }
    });
  }

  /**
   * Generate match reasons based on job and candidate data
   */
  private static generateMatchReasons(
    job: any,
    candidate: any,
    score: number
  ): string[] {
    const reasons: string[] = [];

    // Score-based reasons
    if (score >= 95) {
      reasons.push('exceptional_match');
    } else if (score >= 90) {
      reasons.push('strong_match');
    } else if (score >= 85) {
      reasons.push('good_match');
    } else if (score >= 80) {
      reasons.push('decent_match');
    }

    // Skills overlap
    const jobSkills = job.skills || [];
    const candidateSkills = candidate.skills || [];
    const skillsOverlap = jobSkills.filter((skill: string) => 
      candidateSkills.some((cSkill: string) => 
        cSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(cSkill.toLowerCase())
      )
    );

    if (skillsOverlap.length > 0) {
      reasons.push('skills_match');
    }

    // Industry experience
    const candidateIndustries = candidate.industries || [];
    if (candidateIndustries.some((industry: string) => 
      job.description.toLowerCase().includes(industry.toLowerCase())
    )) {
      reasons.push('industry_experience');
    }

    // Job title relevance
    const candidateJobTitles = candidate.jobTitles || [];
    if (candidateJobTitles.some((title: string) => 
      job.title.toLowerCase().includes(title.toLowerCase()) ||
      title.toLowerCase().includes(job.title.toLowerCase())
    )) {
      reasons.push('title_match');
    }

    // Location proximity (basic)
    if (candidate.user.location && job.location) {
      const candidateLoc = candidate.user.location.toLowerCase();
      const jobLoc = job.location.toLowerCase();
      if (candidateLoc.includes(jobLoc) || jobLoc.includes(candidateLoc)) {
        reasons.push('location_match');
      }
    }

    return reasons.length > 0 ? reasons : ['ai_similarity'];
  }

  /**
   * Save job matches to database
   */
  static async saveJobMatches(
    jobId: string, 
    matches: JobMatchResult[], 
    minScore: number = 80
  ): Promise<void> {
    try {
      console.log(`💾 Saving ${matches.length} job matches for job: ${jobId}`);

      // Filter matches above threshold
      const qualifiedMatches = matches.filter(match => match.score >= minScore);

      if (qualifiedMatches.length === 0) {
        console.log(`ℹ️ No matches above threshold (${minScore}) for job: ${jobId}`);
        return;
      }

      // Prepare batch insert data
      const matchData = qualifiedMatches.map(match => ({
        jobId,
        userId: match.userId,
        score: match.score,
        matchReason: match.matchReason,
        matchType: 'ai_featured' as const,
        emailSent: false,
        notificationSent: false
      }));

      // Use upsert to avoid duplicates
      await Promise.all(
        matchData.map(data =>
          prisma.jobMatch.upsert({
            where: {
              jobId_userId: {
                jobId: data.jobId,
                userId: data.userId
              }
            },
            update: {
              score: data.score,
              matchReason: data.matchReason,
              updatedAt: new Date()
            },
            create: data
          })
        )
      );

      console.log(`✅ Saved ${qualifiedMatches.length} job matches for job: ${jobId}`);
    } catch (error) {
      console.error(`❌ Failed to save job matches for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get matches for a specific job
   */
  static async getJobMatches(jobId: string, minScore: number = 80) {
    return await prisma.jobMatch.findMany({
      where: {
        jobId,
        score: {
          gte: minScore
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            location: true,
            resumeUrl: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true
          }
        }
      },
      orderBy: {
        score: 'desc'
      }
    });
  }

  /**
   * Get matches for a specific user
   */
  static async getUserMatches(userId: string, limit: number = 20) {
    return await prisma.jobMatch.findMany({
      where: {
        userId,
        job: {
          status: 'active',
          featured: true
        }
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            description: true,
            jobType: true,
            salaryMin: true,
            salaryMax: true,
            postedAt: true
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });
  }

  /**
   * Mark email as sent for job matches
   */
  static async markEmailSent(jobId: string, userIds: string[]): Promise<void> {
    await prisma.jobMatch.updateMany({
      where: {
        jobId,
        userId: {
          in: userIds
        }
      },
      data: {
        emailSent: true,
        emailSentAt: new Date()
      }
    });

    // Track email alerts in analytics
    await FeaturedJobAnalyticsService.trackEmailAlert(jobId, userIds.length);
  }

  /**
   * Track email interactions
   */
  static async trackEmailInteraction(
    jobId: string, 
    userId: string, 
    interaction: 'opened' | 'clicked'
  ): Promise<void> {
    const updateData = interaction === 'opened' 
      ? { emailOpened: true, emailOpenedAt: new Date() }
      : { emailClicked: true, emailClickedAt: new Date() };

    await prisma.jobMatch.updateMany({
      where: { jobId, userId },
      data: updateData
    });

    // Track in analytics if clicked
    if (interaction === 'clicked') {
      await FeaturedJobAnalyticsService.trackEmailClick(jobId);
    }
  }

  /**
   * Get matching statistics for a job
   */
  static async getMatchingStats(jobId: string): Promise<MatchingStats> {
    const matches = await prisma.jobMatch.findMany({
      where: { jobId },
      select: {
        score: true,
        emailSent: true
      }
    });

    const totalCandidates = matches.length;
    const emailsSent = matches.filter(m => m.emailSent).length;
    const highScoreMatches = matches.filter(m => m.score >= this.HIGH_SCORE_THRESHOLD).length;
    
    const totalScore = matches.reduce((sum, match) => sum + match.score, 0);
    const averageScore = totalCandidates > 0 ? totalScore / totalCandidates : 0;
    const topScore = matches.length > 0 ? Math.max(...matches.map(m => m.score)) : 0;

    return {
      totalCandidates,
      highScoreMatches,
      emailsSent,
      averageScore,
      topScore
    };
  }

  /**
   * Process featured job matching (main entry point)
   */
  static async processFeaturedJobMatching(jobId: string): Promise<{
    success: boolean;
    matchesFound: number;
    emailsToSend: number;
    emailsQueued: boolean;
    error?: string;
  }> {
    try {
      console.log(`🚀 Starting featured job matching for job: ${jobId}`);

      // Find matching candidates
      const { matches, stats } = await this.findMatchingCandidates(jobId);

      // Save matches to database
      await this.saveJobMatches(jobId, matches, this.MIN_SCORE_THRESHOLD);

      // Count how many emails should be sent
      const qualifiedMatches = matches.filter(m => m.score >= this.MIN_SCORE_THRESHOLD);
      const emailsToSend = qualifiedMatches.length;

      console.log(`✅ Featured job matching completed for job: ${jobId}`);
      console.log(`📊 Stats: ${stats.totalCandidates} candidates, ${emailsToSend} emails to send`);

      // Queue email sending if we have qualified matches
      let emailsQueued = false;
      if (emailsToSend > 0) {
        try {
          const { JobQueueService } = await import('./job-queue');
          
          // Queue email batch with slight delay to ensure job processing is complete
          await JobQueueService.enqueueJob('email_batch', 
            { jobId, template: 'featured_job_match' },
            { priority: 8, delayMs: 30000 } // 30 second delay
          );
          
          emailsQueued = true;
          console.log(`📬 Email batch queued for job ${jobId}: ${emailsToSend} emails`);
        } catch (emailError) {
          console.error(`Failed to queue emails for job ${jobId}:`, emailError);
          // Don't fail the entire process if email queueing fails
        }
      }

      return {
        success: true,
        matchesFound: matches.length,
        emailsToSend,
        emailsQueued,
      };
    } catch (error) {
      console.error(`❌ Featured job matching failed for job ${jobId}:`, error);
      return {
        success: false,
        matchesFound: 0,
        emailsToSend: 0,
        emailsQueued: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}