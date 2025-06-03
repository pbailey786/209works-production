/**
 * Regional Job Service
 * Handles regional job filtering, assignment, and management
 */

import { prisma } from '@/lib/database/prisma';
import { Job, JobType } from '@prisma/client';

export interface RegionalJobFilters {
  region?: string;
  jobType?: JobType;
  location?: string;
  keywords?: string;
  salaryMin?: number;
  salaryMax?: number;
  postedAfter?: Date;
  categories?: string[];
  limit?: number;
  offset?: number;
}

export interface RegionalStats {
  region: string;
  totalJobs: number;
  newJobsThisWeek: number;
  topCategories: Array<{ category: string; count: number }>;
  averageSalary: number | null;
  topCompanies: Array<{ company: string; count: number }>;
}

export class RegionalJobService {
  /**
   * Get jobs filtered by region and other criteria
   */
  static async getRegionalJobs(filters: RegionalJobFilters) {
    const {
      region,
      jobType,
      location,
      keywords,
      salaryMin,
      salaryMax,
      postedAfter,
      categories,
      limit = 20,
      offset = 0,
    } = filters;

    const where: any = {
      deletedAt: null, // Exclude soft-deleted jobs
    };

    // Regional filtering
    if (region) {
      where.region = region;
    }

    // Job type filtering
    if (jobType) {
      where.jobType = jobType;
    }

    // Location filtering (in addition to region)
    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    // Keyword search
    if (keywords) {
      where.OR = [
        {
          title: {
            contains: keywords,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: keywords,
            mode: 'insensitive',
          },
        },
        {
          company: {
            contains: keywords,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Salary filtering
    if (salaryMin || salaryMax) {
      where.AND = [];
      if (salaryMin) {
        where.AND.push({
          OR: [
            { salaryMin: { gte: salaryMin } },
            { salaryMax: { gte: salaryMin } },
          ],
        });
      }
      if (salaryMax) {
        where.AND.push({
          OR: [
            { salaryMax: { lte: salaryMax } },
            { salaryMin: { lte: salaryMax } },
          ],
        });
      }
    }

    // Date filtering
    if (postedAfter) {
      where.postedAt = {
        gte: postedAfter,
      };
    }

    // Category filtering
    if (categories && categories.length > 0) {
      where.categories = {
        hasSome: categories,
      };
    }

    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { postedAt: 'desc' }],
        take: limit,
        skip: offset,
        include: {
          companyRef: {
            select: {
              name: true,
              logo: true,
              website: true,
            },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs,
      totalCount,
      hasMore: offset + limit < totalCount,
      pagination: {
        limit,
        offset,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Math.floor(offset / limit) + 1,
      },
    };
  }

  /**
   * Get regional statistics
   */
  static async getRegionalStats(region: string): Promise<RegionalStats> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get total jobs in region
    const totalJobs = await prisma.job.count({
      where: {
        region,
        deletedAt: null,
      },
    });

    // Get new jobs this week
    const newJobsThisWeek = await prisma.job.count({
      where: {
        region,
        deletedAt: null,
        postedAt: {
          gte: oneWeekAgo,
        },
      },
    });

    // Get top categories
    const categoryStats = await prisma.job.groupBy({
      by: ['categories'],
      where: {
        region,
        deletedAt: null,
      },
      _count: {
        categories: true,
      },
      orderBy: {
        _count: {
          categories: 'desc',
        },
      },
      take: 5,
    });

    // Flatten categories and count them
    const categoryMap = new Map<string, number>();
    categoryStats.forEach(stat => {
      stat.categories.forEach(category => {
        categoryMap.set(
          category,
          (categoryMap.get(category) || 0) + stat._count.categories
        );
      });
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get average salary
    const salaryStats = await prisma.job.aggregate({
      where: {
        region,
        deletedAt: null,
        OR: [{ salaryMin: { not: null } }, { salaryMax: { not: null } }],
      },
      _avg: {
        salaryMin: true,
        salaryMax: true,
      },
    });

    const averageSalary =
      salaryStats._avg.salaryMin && salaryStats._avg.salaryMax
        ? (salaryStats._avg.salaryMin + salaryStats._avg.salaryMax) / 2
        : salaryStats._avg.salaryMin || salaryStats._avg.salaryMax || null;

    // Get top companies
    const companyStats = await prisma.job.groupBy({
      by: ['company'],
      where: {
        region,
        deletedAt: null,
      },
      _count: {
        company: true,
      },
      orderBy: {
        _count: {
          company: 'desc',
        },
      },
      take: 5,
    });

    const topCompanies = companyStats.map(stat => ({
      company: stat.company,
      count: stat._count.company,
    }));

    return {
      region,
      totalJobs,
      newJobsThisWeek,
      topCategories,
      averageSalary,
      topCompanies,
    };
  }

  /**
   * Assign region to a job based on location
   */
  static assignRegionToJob(location: string): string | null {
    const locationLower = location.toLowerCase();

    // Central Valley (209)
    const centralValleyCities = [
      'stockton',
      'modesto',
      'tracy',
      'manteca',
      'lodi',
      'turlock',
      'merced',
      'fresno',
      'visalia',
      'bakersfield',
      'delano',
      'hanford',
      'tulare',
    ];

    // Sacramento Metro (916)
    const sacramentoCities = [
      'sacramento',
      'elk grove',
      'roseville',
      'folsom',
      'davis',
      'woodland',
      'west sacramento',
      'citrus heights',
      'rancho cordova',
      'fair oaks',
    ];

    // East Bay (510)
    const eastBayCities = [
      'oakland',
      'berkeley',
      'fremont',
      'hayward',
      'richmond',
      'alameda',
      'san leandro',
      'union city',
      'newark',
      'emeryville',
      'albany',
    ];

    // Check for specific regional matches
    for (const city of centralValleyCities) {
      if (locationLower.includes(city)) {
        return '209';
      }
    }

    for (const city of sacramentoCities) {
      if (locationLower.includes(city)) {
        return '916';
      }
    }

    for (const city of eastBayCities) {
      if (locationLower.includes(city)) {
        return '510';
      }
    }

    // Check for broader regional indicators
    if (locationLower.includes('central valley')) {
      return '209';
    }

    if (
      locationLower.includes('sacramento') ||
      locationLower.includes('sac metro')
    ) {
      return '916';
    }

    if (
      locationLower.includes('east bay') ||
      locationLower.includes('oakland') ||
      locationLower.includes('berkeley')
    ) {
      return '510';
    }

    // If it's in Northern California but not specific, assign to norcal
    if (
      locationLower.includes('northern california') ||
      locationLower.includes('norcal') ||
      locationLower.includes('bay area') ||
      locationLower.includes('san francisco') ||
      locationLower.includes('silicon valley')
    ) {
      return 'norcal';
    }

    return null; // No regional assignment
  }

  /**
   * Bulk update existing jobs with regional assignments
   */
  static async assignRegionsToExistingJobs() {
    const jobs = await prisma.job.findMany({
      where: {
        region: null,
        deletedAt: null,
      },
      select: {
        id: true,
        location: true,
      },
    });

    const updates = [];
    let assignedCount = 0;

    for (const job of jobs) {
      const region = this.assignRegionToJob(job.location);
      if (region) {
        updates.push(
          prisma.job.update({
            where: { id: job.id },
            data: { region },
          })
        );
        assignedCount++;
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return {
      totalJobs: jobs.length,
      assignedJobs: assignedCount,
      unassignedJobs: jobs.length - assignedCount,
    };
  }

  /**
   * Get all available regions with job counts
   */
  static async getRegionSummary() {
    const regionStats = await prisma.job.groupBy({
      by: ['region'],
      where: {
        deletedAt: null,
        region: { not: null },
      },
      _count: {
        region: true,
      },
      orderBy: {
        _count: {
          region: 'desc',
        },
      },
    });

    const regionNames = {
      '209': 'Central Valley',
      '916': 'Sacramento Metro',
      '510': 'East Bay',
      norcal: 'Northern California',
    };

    return regionStats.map(stat => ({
      region: stat.region,
      name: regionNames[stat.region as keyof typeof regionNames] || stat.region,
      jobCount: stat._count.region,
    }));
  }

  /**
   * Search jobs across multiple regions
   */
  static async searchAcrossRegions(
    query: string,
    regions: string[] = ['209', '916', '510', 'norcal'],
    limit: number = 20
  ) {
    const results = await Promise.all(
      regions.map(async region => {
        const regionJobs = await this.getRegionalJobs({
          region,
          keywords: query,
          limit: Math.ceil(limit / regions.length),
        });

        return {
          region,
          jobs: regionJobs.jobs,
          totalCount: regionJobs.totalCount,
        };
      })
    );

    // Combine and sort all jobs by relevance/date
    const allJobs = results.flatMap(result =>
      result.jobs.map(job => ({
        ...job,
        sourceRegion: result.region,
      }))
    );

    // Sort by pinned status and date
    allJobs.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });

    return {
      jobs: allJobs.slice(0, limit),
      regionBreakdown: results.map(result => ({
        region: result.region,
        count: result.totalCount,
      })),
      totalAcrossRegions: results.reduce(
        (sum, result) => sum + result.totalCount,
        0
      ),
    };
  }
}
