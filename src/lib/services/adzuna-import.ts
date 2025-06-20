import { fetchAdzunaJobs, AdzunaJob } from '@/components/ui/card';
import { prisma } from '@/components/ui/card';
import { JobType } from '@prisma/client';


export class AdzunaImportService {
  /**
   * Map Adzuna contract time to our JobType enum
   */
  private static mapContractTimeToJobType(contract_time?: string): JobType {
    switch (contract_time?.toLowerCase()) {
      case 'full_time':
      case 'fulltime':
      case 'full-time':
        return 'full_time';
      case 'part_time':
      case 'parttime':
      case 'part-time':
        return 'part_time';
      case 'contract':
      case 'contractor':
        return 'contract';
      case 'internship':
      case 'intern':
        return 'internship';
      case 'temporary':
      case 'temp':
        return 'temporary';
      case 'volunteer':
        return 'volunteer';
      default:
        return 'other';
    }
  }

  /**
   * Clean and validate job description
   */
  private static cleanJobDescription(description: string): string {
    if (!description) return '';

    // Remove excessive HTML tags and clean up
    let cleaned = description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    // Limit description length
    if (cleaned.length > 5000) {
      cleaned = cleaned.substring(0, 5000) + '...';
    }

    return cleaned;
  }

  /**
   * Validate job data quality - Enhanced for 209 local focus
   */
  private static isValidJob(job: AdzunaJob): boolean {
    // Must have title and company
    if (!job.title || !job.company?.display_name) {
      return false;
    }

    // Must have location
    if (!job.location?.display_name) {
      return false;
    }

    // Must have description
    if (!job.description || job.description.length < 50) {
      return false;
    }

    const title = job.title.toLowerCase();
    const description = job.description.toLowerCase();
    const company = job.company?.display_name?.toLowerCase() || '';
    const location = job.location?.display_name?.toLowerCase() || '';

    // REMOVE: Remote/Work from home jobs (not local to 209)
    const remoteKeywords = [
      'remote',
      'work from home',
      'work-from-home',
      'wfh',
      'telecommute',
      'virtual',
      'anywhere',
      'home-based',
      'distributed team',
      'remote-first',
      'fully remote',
      'remote position',
      'remote opportunity',
    ];

    if (
      remoteKeywords.some(
        keyword =>
          title.includes(keyword) ||
          description.includes(keyword) ||
          location.includes(keyword)
      )
    ) {
      return false;
    }

    // REMOVE: Common spam/MLM/low quality keywords
    const spamKeywords = [
      'make money',
      'earn $',
      'easy money',
      'click here',
      'apply now!!!',
      'urgent!!!',
      'no experience required',
      'make up to',
      'earn up to',
      'flexible schedule',
      'be your own boss',
      'unlimited income',
      'financial freedom',
      'side hustle',
      'extra income',
      'part time income',
      'work when you want',
      'set your own hours',
      'no selling',
      'no cold calling',
      'ground floor opportunity',
      'life changing',
      'revolutionary',
      'breakthrough',
      'secret',
      'amazing opportunity',
      'limited time',
      'act now',
      "don't wait",
    ];

    if (
      spamKeywords.some(
        keyword => title.includes(keyword) || description.includes(keyword)
      )
    ) {
      return false;
    }

    // REMOVE: Repetitive company patterns (MLM/Insurance/etc)
    const repetitiveCompanies = [
      'primerica',
      'aflac',
      'farmers insurance',
      'state farm',
      'allstate',
      'american income life',
      'globe life',
      'symmetry financial',
      'family first life',
      'php agency',
      'world financial group',
      'wfg',
      'vector marketing',
      'cutco',
      'kirby',
      'rainbow vacuum',
      'southwestern advantage',
      'college works painting',
      'vivint',
      'aptive',
      'pest defense',
      'alarm.com',
    ];

    if (
      repetitiveCompanies.some(companyName => company.includes(companyName))
    ) {
      return false;
    }

    // REMOVE: Repetitive job titles that flood job boards
    const repetitiveTitles = [
      'insurance agent',
      'insurance sales',
      'life insurance',
      'sales representative - no experience',
      'customer service representative - remote',
      'data entry clerk - remote',
      'virtual assistant',
      'online customer service',
      'work from home customer service',
      'entry level sales',
      'marketing representative',
      'brand ambassador',
      'promotional model',
      'mystery shopper',
      'survey taker',
      'product tester',
      'focus group participant',
      'freelance writer',
      'content creator',
      'social media manager - remote',
      'digital marketing specialist - remote',
    ];

    if (repetitiveTitles.some(titlePattern => title.includes(titlePattern))) {
      return false;
    }

    // REMOVE: Jobs with excessive punctuation (spam indicator)
    const exclamationCount = (title.match(/!/g) || []).length;
    const questionCount = (title.match(/\?/g) || []).length;

    if (exclamationCount > 2 || questionCount > 1) {
      return false;
    }

    // REMOVE: Jobs with salary ranges that are unrealistic/spammy
    if (job.salary_min && job.salary_max) {
      const salaryRange = job.salary_max - job.salary_min;
      const avgSalary = (job.salary_min + job.salary_max) / 2;

      // Unrealistic salary ranges (too wide or too high for entry level)
      if (
        salaryRange > 100000 ||
        (avgSalary > 150000 && title.includes('entry level'))
      ) {
        return false;
      }
    }

    // ENSURE: Job is actually in a 209 area city (double-check location)
    const valid209Cities = [
      'stockton',
      'modesto',
      'tracy',
      'manteca',
      'lodi',
      'turlock',
      'merced',
      'ceres',
      'patterson',
      'ripon',
      'escalon',
      'oakdale',
      'riverbank',
      'hughson',
      'newman',
      'gustine',
      'los banos',
      'atwater',
      'livingston',
      'winton',
      'hilmar',
      'stevinson',
      'crows landing',
      'vernalis',
    ];

    const isIn209 = valid209Cities.some(city => location.includes(city));

    if (!isIn209) {
      return false;
    }

    return true;
  }

  /**
   * Extract skills from job description
   */
  private static extractSkills(description: string): string[] {
    const skillKeywords = [
      'javascript',
      'python',
      'java',
      'react',
      'node.js',
      'sql',
      'html',
      'css',
      'customer service',
      'sales',
      'marketing',
      'accounting',
      'excel',
      'word',
      'communication',
      'teamwork',
      'leadership',
      'problem solving',
      'organization',
      'time management',
      'microsoft office',
      'data entry',
      'bilingual',
      'spanish',
      'forklift',
      'warehouse',
      'retail',
      'food service',
      'healthcare',
      'nursing',
      'administrative',
      'receptionist',
      'cashier',
      'driver',
      'cdl',
      'construction',
      'maintenance',
      'cleaning',
      'security',
      'teaching',
      'education',
    ];

    const foundSkills: string[] = [];
    const lowerDesc = description.toLowerCase();

    skillKeywords.forEach(skill => {
      if (lowerDesc.includes(skill)) {
        foundSkills.push(skill);
      }
    });

    return foundSkills.slice(0, 10); // Limit to 10 skills
  }

  /**
   * Check for duplicate jobs based on title and company similarity
   */
  private static async isDuplicateJob(job: AdzunaJob): Promise<boolean> {
    try {
      // Look for jobs with very similar titles and companies
      const similarJobs = await prisma.job.findMany({
        where: {
          AND: [
            {
              title: {
                contains: job.title.substring(0, 20), // First 20 chars of title
                mode: 'insensitive',
              },
            },
            {
              company: {
                contains: job.company?.display_name?.substring(0, 15) || '', // First 15 chars of company
                mode: 'insensitive',
              },
            },
            {
              location: {
                contains: job.location?.display_name?.split(',')[0] || '', // City name only
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          company: true,
        },
      });

      // If we find similar jobs, it's likely a duplicate
      return similarJobs.length > 0;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return false; // If error, allow the job through
    }
  }

  /**
   * Import jobs from Adzuna with enhanced processing
   */
  static async importJobs(
    options: {
      cities?: string[];
      resultsPerCity?: number;
      maxJobs?: number;
      filterQuality?: boolean;
      removeDuplicates?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    imported: number;
    skipped: number;
    errors: number;
    duplicates: number;
    details: string[];
  }> {
    const {
      cities,
      resultsPerCity = 25,
      maxJobs = 500,
      filterQuality = true,
      removeDuplicates = true,
    } = options;

    const result = {
      success: false,
      imported: 0,
      skipped: 0,
      errors: 0,
      duplicates: 0,
      details: [] as string[],
    };

    try {
      result.details.push('🚀 Starting Adzuna job import...');

      // Fetch jobs from Adzuna
      const adzunaJobs = await fetchAdzunaJobs(cities, resultsPerCity);
      result.details.push(`📥 Fetched ${adzunaJobs.length} jobs from Adzuna`);

      // Limit total jobs if specified
      const jobsToProcess = maxJobs ? adzunaJobs.slice(0, maxJobs) : adzunaJobs;

      for (const job of jobsToProcess) {
        try {
          // Validate job quality
          if (filterQuality && !this.isValidJob(job)) {
            result.skipped++;
            continue;
          }

          // Check for duplicates
          if (removeDuplicates && (await this.isDuplicateJob(job))) {
            result.duplicates++;
            continue;
          }

          // Check if job already exists by ID
          const existingJob = await prisma.job.findUnique({
            where: { id: job.id },
          });

          // Clean and prepare job data
          const cleanDescription = this.cleanJobDescription(job.description);
          const extractedSkills = this.extractSkills(cleanDescription);

          const mappedJobType = this.mapContractTimeToJobType(
            job.contract_time
          );

          const jobData = {
            title: job.title.trim(),
            company: job.company?.display_name?.trim() || 'Unknown Company',
            description: cleanDescription,
            location: job.location?.display_name?.trim() || '',
            salaryMin: job.salary_min ?? null,
            salaryMax: job.salary_max ?? null,
            jobType: mappedJobType, // This maps to 'type' column in database
            categories: job.category?.label ? [job.category.label] : [],
            skills: extractedSkills,
            source: 'adzuna',
            url: job.redirect_url,
            postedAt: new Date(job.created),
            updatedAt: new Date(),
          };

          if (existingJob) {
            // Update existing job
            await prisma.job.update({
              where: { id: job.id },
              data: jobData,
            });
          } else {
            // Create new job
            await prisma.job.create({
              data: {
                id: job.id,
                ...jobData,
              },
            });
          }

          result.imported++;

          // Log progress every 50 jobs
          if (result.imported % 50 === 0) {
            result.details.push(`✅ Processed ${result.imported} jobs...`);
          }
        } catch (error) {
          result.errors++;
          console.error(`Error processing job ${job.id}:`, error);

          if (result.errors < 10) {
            // Only log first 10 errors
            result.details.push(
              `❌ Error processing job ${job.title}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      }

      result.success = true;
      result.details.push(
        `🎉 Import completed! Imported: ${result.imported}, Skipped: ${result.skipped}, Duplicates: ${result.duplicates}, Errors: ${result.errors}`
      );
    } catch (error) {
      result.success = false;
      result.details.push(
        `💥 Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Adzuna import failed:', error);
    }

    return result;
  }

  /**
   * Clean up old Adzuna jobs (older than 30 days)
   */
  static async cleanupOldJobs(): Promise<{
    success: boolean;
    deleted: number;
    message: string;
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deleteResult = await prisma.job.deleteMany({
        where: {
          source: 'adzuna',
          postedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      return {
        success: true,
        deleted: deleteResult.count,
        message: `Cleaned up ${deleteResult.count} old Adzuna jobs`,
      };
    } catch (error) {
      return {
        success: false,
        deleted: 0,
        message: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get import statistics
   */
  static async getImportStats(): Promise<{
    totalAdzunaJobs: number;
    recentJobs: number;
    oldestJob: Date | null;
    newestJob: Date | null;
    jobsByType: Record<string, number>;
  }> {
    const [totalAdzunaJobs, recentJobs, oldestJob, newestJob, jobsByType] =
      await Promise.all([
        // Total Adzuna jobs
        prisma.job.count({
          where: { source: 'adzuna' },
        }),

        // Jobs from last 7 days
        prisma.job.count({
          where: {
            source: 'adzuna',
            postedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Oldest job
        prisma.job.findFirst({
          where: { source: 'adzuna' },
          orderBy: { postedAt: 'asc' },
          select: { postedAt: true },
        }),

        // Newest job
        prisma.job.findFirst({
          where: { source: 'adzuna' },
          orderBy: { postedAt: 'desc' },
          select: { postedAt: true },
        }),

        // Jobs by type
        prisma.job.groupBy({
          by: ['jobType'],
          where: { source: 'adzuna' },
          _count: true,
        }),
      ]);

    const jobTypeStats: Record<string, number> = {};
    jobsByType.forEach(item => {
      jobTypeStats[item.jobType] = item._count;
    });

    return {
      totalAdzunaJobs,
      recentJobs,
      oldestJob: oldestJob?.postedAt || null,
      newestJob: newestJob?.postedAt || null,
      jobsByType: jobTypeStats,
    };
  }
}
