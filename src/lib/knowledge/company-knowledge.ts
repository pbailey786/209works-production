import { prisma } from '@/lib/database/prisma';
import {

  CompanyKnowledgeCategory,
  CompanyKnowledgeSource,
  Prisma,
} from '@prisma/client';

export interface CompanyInfo {
  id: string;
  name: string;
  slug: string;
  website?: string;
  logo?: string;
  description?: string;
  industry?: string;
  size?: string;
  headquarters?: string;
  subscriptionTier?: string;
  knowledgeEntries: CompanyKnowledgeEntry[];
}

export interface CompanyKnowledgeEntry {
  id: string;
  category: CompanyKnowledgeCategory;
  title: string;
  content: string;
  keywords: string[];
  source: CompanyKnowledgeSource;
  verified: boolean;
  priority: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyKnowledgeInput {
  companyId: string;
  category: CompanyKnowledgeCategory;
  title: string;
  content: string;
  keywords?: string[];
  source?: CompanyKnowledgeSource;
  priority?: number;
}

export interface CompanySearchParams {
  query?: string;
  category?: CompanyKnowledgeCategory;
  verified?: boolean;
  limit?: number;
}

export class CompanyKnowledgeService {
  /**
   * Get comprehensive company information including knowledge base
   */
  static async getCompanyInfo(identifier: string): Promise<CompanyInfo | null> {
    try {
      // Try to find by name first, then by slug
      const company = await prisma.company.findFirst({
        where: {
          OR: [
            { name: { equals: identifier, mode: 'insensitive' } },
            { slug: identifier.toLowerCase() },
          ],
          isActive: true,
        },
        include: {
          knowledgeBase: {
            where: { verified: true },
            orderBy: [
              { priority: 'desc' },
              { views: 'desc' },
              { updatedAt: 'desc' },
            ],
          },
        },
      });

      if (!company) {
        return null;
      }

      return {
        id: company.id,
        name: company.name,
        slug: company.slug,
        website: company.website ?? undefined,
        logo: company.logo ?? undefined,
        description: company.description ?? undefined,
        industry: company.industry ?? undefined,
        size: company.size ?? undefined,
        headquarters: company.headquarters ?? undefined,
        subscriptionTier: company.subscriptionTier ?? undefined,
        knowledgeEntries: company.knowledgeBase.map(entry => ({
          id: entry.id,
          category: entry.category,
          title: entry.title,
          content: entry.content,
          keywords: entry.keywords,
          source: entry.source,
          verified: entry.verified,
          priority: entry.priority,
          views: entry.views,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        })),
      };
    } catch (error) {
      console.error('Error fetching company info:', error);
      return null;
    }
  }

  /**
   * Search company knowledge base with natural language queries
   */
  static async searchCompanyKnowledge(
    companyIdentifier: string,
    params: CompanySearchParams
  ): Promise<CompanyKnowledgeEntry[]> {
    try {
      // First get the company
      const company = await prisma.company.findFirst({
        where: {
          OR: [
            { name: { equals: companyIdentifier, mode: 'insensitive' } },
            { slug: companyIdentifier.toLowerCase() },
          ],
          isActive: true,
        },
      });

      if (!company) {
        return [];
      }

      // Build search conditions
      const searchConditions: any = {
        companyId: company.id,
        verified: params.verified !== false, // Default to verified entries
      };

      if (params.category) {
        searchConditions.category = params.category;
      }

      // If query provided, search in title, content, and keywords
      if (params.query) {
        const searchTerms = params.query.toLowerCase().split(' ');
        searchConditions.OR = [
          { title: { contains: params.query, mode: 'insensitive' } },
          { content: { contains: params.query, mode: 'insensitive' } },
          { keywords: { hasSome: searchTerms } },
        ];
      }

      const entries = await prisma.companyKnowledge.findMany({
        where: searchConditions,
        orderBy: [
          { priority: 'desc' },
          { views: 'desc' },
          { updatedAt: 'desc' },
        ],
        take: params.limit || 10,
      });

      // Update view counts for retrieved entries
      if (entries.length > 0) {
        await this.incrementViewCounts(entries.map(e => e.id));
      }

      return entries.map(entry => ({
        id: entry.id,
        category: entry.category,
        title: entry.title,
        content: entry.content,
        keywords: entry.keywords,
        source: entry.source,
        verified: entry.verified,
        priority: entry.priority,
        views: entry.views + 1, // Reflect the increment
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      }));
    } catch (error) {
      console.error('Error searching company knowledge:', error);
      return [];
    }
  }

  /**
   * Get knowledge entries by category for a company
   */
  static async getCompanyKnowledgeByCategory(
    companyIdentifier: string,
    category: CompanyKnowledgeCategory
  ): Promise<CompanyKnowledgeEntry[]> {
    return this.searchCompanyKnowledge(companyIdentifier, {
      category,
      verified: true,
    });
  }

  /**
   * Add new knowledge entry for a company
   */
  static async addCompanyKnowledge(
    input: CompanyKnowledgeInput
  ): Promise<CompanyKnowledgeEntry | null> {
    try {
      const entry = await prisma.companyKnowledge.create({
        data: {
          companyId: input.companyId,
          category: input.category,
          title: input.title,
          content: input.content,
          keywords: input.keywords || [],
          source: input.source || 'company_provided',
          priority: input.priority || 0,
          verified:
            input.source === 'hr_verified' || input.source === 'admin_created',
        },
      });

      return {
        id: entry.id,
        category: entry.category,
        title: entry.title,
        content: entry.content,
        keywords: entry.keywords,
        source: entry.source,
        verified: entry.verified,
        priority: entry.priority,
        views: entry.views,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    } catch (error) {
      console.error('Error adding company knowledge:', error);
      return null;
    }
  }

  /**
   * Update existing knowledge entry
   */
  static async updateCompanyKnowledge(
    entryId: string,
    updates: Partial<CompanyKnowledgeInput>
  ): Promise<CompanyKnowledgeEntry | null> {
    try {
      const entry = await prisma.companyKnowledge.update({
        where: { id: entryId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      return {
        id: entry.id,
        category: entry.category,
        title: entry.title,
        content: entry.content,
        keywords: entry.keywords,
        source: entry.source,
        verified: entry.verified,
        priority: entry.priority,
        views: entry.views,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    } catch (error) {
      console.error('Error updating company knowledge:', error);
      return null;
    }
  }

  /**
   * Delete knowledge entry (soft delete)
   */
  static async deleteCompanyKnowledge(entryId: string): Promise<boolean> {
    try {
      // Use soft delete instead of hard delete to preserve audit trail
      await prisma.companyKnowledge.update({
        where: { id: entryId },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch (error) {
      console.error('Error deleting company knowledge:', error);
      return false;
    }
  }

  /**
   * Get companies that have jobs posted (for migration/seeding)
   */
  static async getCompaniesFromJobs(): Promise<
    { name: string; count: number }[]
  > {
    try {
      const companies = await prisma.job.groupBy({
        by: ['company'],
        _count: {
          company: true,
        },
        orderBy: {
          _count: {
            company: 'desc',
          },
        },
        take: 100, // Top 100 companies by job count
      });

      return companies.map(company => ({
        name: company.company,
        count: company._count.company,
      }));
    } catch (error) {
      console.error('Error getting companies from jobs:', error);
      return [];
    }
  }

  /**
   * Create company from job data (for migration)
   */
  static async createCompanyFromJobData(
    companyName: string
  ): Promise<string | null> {
    try {
      // Create slug from company name
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const company = await prisma.company.create({
        data: {
          name: companyName,
          slug: slug,
          isActive: true,
          subscriptionTier: 'basic', // Default tier for companies with jobs
        },
      });

      return company.id;
    } catch (error) {
      console.error('Error creating company:', error);
      return null;
    }
  }

  /**
   * Link existing jobs to companies
   */
  static async linkJobsToCompany(
    companyName: string,
    companyId: string
  ): Promise<number> {
    try {
      const result = await prisma.job.updateMany({
        where: {
          company: companyName,
          companyId: null,
        },
        data: {
          companyId: companyId,
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error linking jobs to company:', error);
      return 0;
    }
  }

  /**
   * Seed default knowledge for a company
   */
  static async seedDefaultKnowledge(
    companyId: string,
    companyName: string
  ): Promise<void> {
    const defaultEntries = [
      {
        category: 'general_info' as CompanyKnowledgeCategory,
        title: 'About Our Company',
        content: `${companyName} is actively hiring and posting job opportunities on 209jobs. We're committed to finding great talent in the Central Valley region.`,
        keywords: ['company', 'about', 'overview'],
        source: 'admin_created' as CompanyKnowledgeSource,
        priority: 10,
      },
      {
        category: 'hiring_process' as CompanyKnowledgeCategory,
        title: 'Application Process',
        content: `To apply for positions at ${companyName}, you can submit your application through our job postings on 209jobs. We review all applications carefully and will contact qualified candidates.`,
        keywords: ['application', 'hiring', 'process', 'apply'],
        source: 'admin_created' as CompanyKnowledgeSource,
        priority: 8,
      },
    ];

    for (const entry of defaultEntries) {
      await this.addCompanyKnowledge({
        companyId,
        ...entry,
      });
    }
  }

  /**
   * Helper: Increment view counts for multiple entries
   */
  private static async incrementViewCounts(entryIds: string[]): Promise<void> {
    try {
      await prisma.companyKnowledge.updateMany({
        where: {
          id: { in: entryIds },
        },
        data: {
          views: { increment: 1 },
          lastViewed: new Date(),
        },
      });
    } catch (error) {
      console.error('Error incrementing view counts:', error);
    }
  }

  /**
   * Extract company name from natural language query
   */
  static extractCompanyName(query: string): string | null {
    // Common patterns for company mentions
    const patterns = [
      /(?:about|at|working at|tell me about|information about|company)\s+([A-Z][A-Za-z\s&.,]+?)(?:\s|$|\?)/i,
      /([A-Z][A-Za-z\s&.,]+?)\s+(?:company|corporation|corp|inc|llc)/i,
      /working\s+(?:at|for)\s+([A-Z][A-Za-z\s&.,]+?)(?:\s|$|\?)/i,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Get analytics for company knowledge usage
   */
  static async getCompanyKnowledgeAnalytics(companyId: string): Promise<any> {
    try {
      const analytics = await prisma.companyKnowledge.groupBy({
        by: ['category'],
        where: { companyId },
        _count: { id: true },
        _sum: { views: true },
        _avg: { views: true },
      });

      const totalEntries = await prisma.companyKnowledge.count({
        where: { companyId },
      });

      const totalViews = await prisma.companyKnowledge.aggregate({
        where: { companyId },
        _sum: { views: true },
      });

      return {
        totalEntries,
        totalViews: totalViews._sum.views || 0,
        byCategory: analytics.map(cat => ({
          category: cat.category,
          entryCount: cat._count.id,
          totalViews: cat._sum.views || 0,
          avgViews: Math.round(cat._avg.views || 0),
        })),
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return null;
    }
  }
}
