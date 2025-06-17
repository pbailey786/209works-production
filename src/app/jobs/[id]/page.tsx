import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { cache } from 'react';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/app/api/auth/prisma';
import JobDetailClient from './JobDetailClient';
import { Job, JobType } from '@prisma/client';
import type { Session } from 'next-auth';
import { safeDBQuery, validateSession } from '@/lib/utils/safe-fetch';

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

// Cached helper function to get job by ID with optimized query
const getJob = cache(async (id: string): Promise<Job | null> => {
  // Validate job ID format
  if (!id || typeof id !== 'string' || id.length < 10) {
    console.error('Invalid job ID format:', id);
    return null;
  }

  const jobQuery = await safeDBQuery(() => 
    prisma.job.findUnique({
      where: { 
        id,
        deletedAt: null, // Exclude soft-deleted jobs
        status: { not: 'deleted' }, // Exclude deleted jobs
      },
      // Only select needed fields for better performance
      select: {
        id: true,
        title: true,
        company: true,
        description: true,
        location: true,
        jobType: true,
        categories: true,
        salaryMin: true,
        salaryMax: true,
        url: true,
        source: true,
        postedAt: true,
        createdAt: true,
        updatedAt: true,
        employerId: true,
        featured: true,
        status: true,
        // Upsell feature fields
        socialMediaShoutout: true,
        placementBump: true,
        upsellBundle: true,
      },
    })
  );

  if (!jobQuery.success) {
    console.error('Database error fetching job:', jobQuery.error);
    return null;
  }

  return jobQuery.data as Job;
});

// Cached helper function to get related jobs with optimized query
const getRelatedJobs = cache(
  async (job: Job, limit: number = 4): Promise<Job[]> => {
    if (!job || !job.id) {
      return [];
    }

    const relatedJobsQuery = await safeDBQuery(() => 
      prisma.job.findMany({
        where: {
          AND: [
            { id: { not: job.id } },
            { deletedAt: null },
            { status: 'active' },
            {
              OR: [
                // Prioritize same company jobs first
                { company: { equals: job.company, mode: 'insensitive' } },
                // Then same job type
                { jobType: job.jobType },
                // Then jobs with overlapping categories
                {
                  categories: {
                    hasSome: job.categories,
                  },
                },
                // Finally same location
                { location: { equals: job.location, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          jobType: true,
          postedAt: true,
          salaryMin: true,
          salaryMax: true,
        },
        orderBy: [
          // Prioritize more recent jobs
          { postedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
      })
    );

    if (!relatedJobsQuery.success) {
      console.error('Error fetching related jobs:', relatedJobsQuery.error);
      return [];
    }

    return relatedJobsQuery.data as Job[];
  }
);

// Cached helper function to check if job is saved by user
const isJobSaved = cache(
  async (jobId: string, userId: string): Promise<boolean> => {
    try {
      const application = await prisma.jobApplication.findUnique({
        where: {
          userId_jobId: {
            userId,
            jobId,
          },
        },
        select: { id: true }, // Only select ID for performance
      });
      return !!application;
    } catch (error) {
      console.error('Error checking saved job:', error);
      return false;
    }
  }
);

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    
    // Validate ID format before attempting database query
    if (!id || typeof id !== 'string' || id.length < 10) {
      return {
        title: 'Invalid Job ID | 209Jobs',
        description: 'The job ID format is invalid.',
        robots: 'noindex, nofollow',
      };
    }
    
    const job = await getJob(id);

    if (!job) {
      return {
        title: 'Job Not Found | 209Jobs',
        description: 'The requested job listing could not be found.',
        robots: 'noindex, nofollow',
      };
    }

    // Validate job data before using it
    if (!job.title || !job.company) {
      return {
        title: 'Job Information Incomplete | 209Jobs',
        description: 'The job listing information is incomplete.',
        robots: 'noindex, nofollow',
      };
    }

    // Truncate description for better SEO with safe string handling
    const jobDescription = job.description || 'No description available';
    const truncatedDescription =
      jobDescription.length > 160
        ? `${jobDescription.substring(0, 157)}...`
        : jobDescription;

  const salaryRange =
    job.salaryMin && job.salaryMax
      ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
      : job.salaryMin
        ? `From $${job.salaryMin.toLocaleString()}`
        : job.salaryMax
          ? `Up to $${job.salaryMax.toLocaleString()}`
          : '';

  // Enhanced metadata for better SEO
  const title = `${job.title} at ${job.company} | 209Jobs`;
  const description = salaryRange
    ? `${truncatedDescription} ${salaryRange} in ${job.location}.`
    : `${truncatedDescription} Located in ${job.location}.`;

  return {
    title,
    description,
    keywords: [
      job.title,
      job.company,
      job.location,
      job.jobType?.replace('_', ' ') || 'job',
      ...(job.categories || []),
      'job search',
      'employment',
      'career opportunities',
    ].filter(Boolean).join(', '),
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: '209Jobs',
      url: `/jobs/${job.id}`,
      locale: 'en_US',
      images: [
        {
          url: '/images/og-job-default.png', // Add a default OG image
          width: 1200,
          height: 630,
          alt: `${job.title} at ${job.company}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@209jobs', // Add your Twitter handle
      creator: '@209jobs',
    },
    alternates: {
      canonical: `/jobs/${job.id}`,
    },
    other: {
      'job:company': job.company,
      'job:location': job.location,
      'job:type': job.jobType,
      'job:posted': job.postedAt?.toISOString() || new Date().toISOString(),
    },
  };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Job Listing | 209Jobs',
      description: 'View job listing on 209Jobs',
      robots: 'noindex, nofollow',
    };
  }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  try {
    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string' || id.length < 10) {
      console.error('Invalid job ID format:', id);
      notFound();
    }

    // Parallelize data fetching for better performance
    const [job, session] = await Promise.all([
      getJob(id),
      getServerSession(authOptions) as Promise<Session | null>,
    ]);

    if (!job) {
      notFound();
    }

    // Validate essential job data
    if (!job.title || !job.company || !job.description) {
      console.error('Job missing essential data:', { id, title: job.title, company: job.company });
      notFound();
    }

  const isAuthenticated = !!session?.user;

    // Get user ID and role if authenticated with safe database query
    let userId: string | undefined;
    let userRole: string | undefined;
    let isJobOwner = false;
    
    if (isAuthenticated && session?.user?.email) {
      const userQuery = await safeDBQuery(() => 
        prisma.user.findUnique({
          where: { email: session.user?.email },
          select: { id: true, role: true },
        })
      );
      
      if (userQuery.success && userQuery.data) {
        userId = userQuery.data.id;
        userRole = userQuery.data.role;
        isJobOwner = userQuery.data.role === 'employer' && userQuery.data.id === job.employerId;
      }
    }

  // Parallelize related jobs and saved status check
  const [relatedJobs, isSaved] = await Promise.all([
    getRelatedJobs(job),
    userId ? isJobSaved(job.id, userId) : Promise.resolve(false),
  ]);

  // Generate optimized structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.postedAt.toISOString(),
    validThrough: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      sameAs: `https://209jobs.com/companies/${encodeURIComponent(job.company.toLowerCase())}`,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location.split(',')[0]?.trim(),
        addressRegion: job.location.split(',')[1]?.trim() || job.location,
        addressCountry: 'US',
      },
    },
    employmentType: job.jobType.toUpperCase().replace('_', '_'),
    jobBenefits: 'Competitive salary and benefits package',
    skills: job.categories.join(', '),
    identifier: {
      '@type': 'PropertyValue',
      name: '209Jobs Job ID',
      value: job.id,
    },
    url: `https://209jobs.com/jobs/${job.id}`,
    applicationContact: {
      '@type': 'ContactPoint',
      url: job.url,
    },
    ...(job.salaryMin &&
      job.salaryMax && {
        baseSalary: {
          '@type': 'MonetaryAmount',
          currency: 'USD',
          value: {
            '@type': 'QuantitativeValue',
            minValue: job.salaryMin,
            maxValue: job.salaryMax,
            unitText: 'YEAR',
          },
        },
      }),
    industry: job.categories.slice(0, 3).join(', '), // Limit for performance
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData, null, 0), // Minified JSON for performance
        }}
      />

      {/* Preload critical resources */}
      <link
        rel="preload"
        href="/fonts/inter-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />

      <JobDetailClient
        job={job}
        relatedJobs={relatedJobs}
        isAuthenticated={isAuthenticated}
        isSaved={isSaved}
        userId={userId}
        userRole={userRole}
        isJobOwner={isJobOwner}
      />
    </>
  );
  } catch (error) {
    console.error('Error in JobDetailPage:', error);
    // Return a safe fallback or trigger not found
    notFound();
  }
}

// Enable static generation for popular job pages
export async function generateStaticParams() {
  try {
    // Generate static pages for the most recent 50 jobs
    const recentJobs = await prisma.job.findMany({
      select: { id: true },
      orderBy: { postedAt: 'desc' },
      take: 50,
    });

    return recentJobs.map(job => ({
      id: job.id,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600; // Revalidate every hour

// Optimize runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // For authenticated features
