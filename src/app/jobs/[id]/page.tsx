import { Metadata } from 'next';
import { notFound } from 'next/navigation';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import { cache } from 'react';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/app/api/auth/prisma';
import JobDetailClient from './JobDetailClient';
import { Job, JobType } from '@prisma/client';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

// Cached helper function to get job by ID with optimized query
const getJob = cache(async (id: string): Promise<Job | null> => {
  try {
    const job = await prisma.job.findUnique({
      where: { id },
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
      },
    });
    return job as Job;
  } catch (error) {
    console.error('Error fetching job:', error);
    return null;
  }
});

// Cached helper function to get related jobs with optimized query
const getRelatedJobs = cache(
  async (job: Job, limit: number = 4): Promise<Job[]> => {
    try {
      // Use a more efficient query with indexed fields
      const relatedJobs = await prisma.job.findMany({
        where: {
          AND: [
            { id: { not: job.id } },
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
      });
      return relatedJobs as Job[];
    } catch (error) {
      console.error('Error fetching related jobs:', error);
      return [];
    }
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
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return {
      title: 'Job Not Found | 209Jobs',
      description: 'The requested job listing could not be found.',
      robots: 'noindex, nofollow',
    };
  }

  // Truncate description for better SEO
  const truncatedDescription =
    job.description.length > 160
      ? `${job.description.substring(0, 157)}...`
      : job.description;

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
      job.jobType.replace('_', ' '),
      ...job.categories,
      'job search',
      'employment',
      'career opportunities',
    ].join(', '),
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
      'job:posted': job.postedAt.toISOString(),
    },
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;

  // Parallelize data fetching for better performance
  const [job, session] = await Promise.all([
    getJob(id),
    // TODO: Replace with Clerk authentication
    Promise.resolve({ user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } }), // Mock session
  ]);

  if (!job) {
    notFound();
  }

  const isAuthenticated = !!session?.user;

  // Get user ID and role if authenticated
  let userId: string | undefined;
  let userRole: string | undefined;
  let isJobOwner = false;
  if (isAuthenticated && session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email },
      select: { id: true, role: true },
    });
    userId = user?.id;
    userRole = user?.role;
    isJobOwner = user?.role === 'employer' && user?.id === job.employerId;
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
}

// Enable static generation for popular job pages
export async function generateStaticParams() {
  // Skip static generation during build if database is not available
  if (process.env.NODE_ENV === 'production' && process.env.NETLIFY) {
    console.log('Skipping static params generation during Netlify build');
    return [];
  }
  
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
