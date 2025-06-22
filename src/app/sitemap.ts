import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getDomainConfig, getAllDomains } from '@/lib/domain/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const hostname = headersList.get('host') || '209.works';
  const domainConfig = getDomainConfig(hostname);
  const baseUrl = `https://${domainConfig.domain}`;

  // Static pages for each domain
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/employers`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ];

  try {
    // Get jobs for this region (if region filtering is implemented)
    // For now, get all active jobs and filter by location if needed
    const jobs = await prisma.job.findMany({
      where: {
        // Add region filtering when available
        // region: domainConfig.areaCode
      },
      select: {
        id: true,
        updatedAt: true,
        location: true,
      },
      take: 10000, // Limit for performance
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Filter jobs by region based on location if region field doesn't exist
    const regionalJobs = jobs.filter(job => {
      if (!job.location) return false;
      return domainConfig.cities.some(city =>
        job.location.toLowerCase().includes(city.toLowerCase())
      );
    });

    // Generate job URLs
    const jobPages = regionalJobs.map(job => ({
      url: `${baseUrl}/jobs/${job.id}`,
      lastModified: job.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticPages, ...jobPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static pages only if database query fails
    return staticPages;
  } finally {
    await prisma.$disconnect();
  }
}
