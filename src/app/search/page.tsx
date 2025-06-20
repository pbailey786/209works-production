import { Suspense } from 'react';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { getDomainConfig } from '@/lib/domain/config';
import EnhancedSearchPageClient from '@/components/search/EnhancedSearchPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const domainConfig = getDomainConfig(hostname);

  return {
    title: `AI-Powered Job Search | ${domainConfig.displayName}`,
    description: `Find your perfect job in ${domainConfig.region} using our advanced AI search. Semantic job matching, personalized recommendations, and smart filters for the ${domainConfig.areaCode} area.`,
    keywords: [
      `${domainConfig.areaCode} jobs`,
      'AI job search',
      'semantic search',
      'job recommendations',
      `${domainConfig.region} employment`,
      'smart job matching',
      'personalized job search',
    ],
    openGraph: {
      title: `AI Job Search - ${domainConfig.displayName}`,
      description: `Discover jobs in ${domainConfig.region} with our AI-powered search engine`,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `AI Job Search - ${domainConfig.displayName}`,
      description: `Find jobs in ${domainConfig.region} using advanced AI`,
    },
  };
}

// Loading component for search page
function SearchPageLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="text-center space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
        </div>

        {/* Search interface skeleton */}
        <div className="max-w-4xl mx-auto">
          <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex justify-between">
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Results skeleton */}
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-3 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Get domain configuration for regional context
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const domainConfig = getDomainConfig(hostname);

  // Extract search parameters
  const initialQuery = typeof searchParams.q === 'string' ? searchParams.q : '';
  const initialFilters = {
    jobType: typeof searchParams.jobType === 'string' ? searchParams.jobType : undefined,
    experienceLevel: typeof searchParams.experienceLevel === 'string' ? searchParams.experienceLevel : undefined,
    location: typeof searchParams.location === 'string' ? searchParams.location : undefined,
    remote: searchParams.remote === 'true',
    salaryMin: typeof searchParams.salaryMin === 'string' ? parseInt(searchParams.salaryMin) : undefined,
    salaryMax: typeof searchParams.salaryMax === 'string' ? parseInt(searchParams.salaryMax) : undefined,
    skills: typeof searchParams.skills === 'string' ? searchParams.skills.split(',') : [],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              AI-Powered Job Search
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find your perfect job in {domainConfig.region} using advanced AI search. 
              Our semantic matching understands what you're really looking for.
            </p>
            
            {/* Quick stats */}
            <div className="flex justify-center gap-8 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">10,000+</div>
                <div className="text-sm text-gray-600">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">95%</div>
                <div className="text-sm text-gray-600">Match Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">2.5s</div>
                <div className="text-sm text-gray-600">Avg Search Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<SearchPageLoading />}>
          <EnhancedSearchPageClient
            initialQuery={initialQuery}
            initialFilters={initialFilters}
            region={domainConfig.areaCode}
            domainConfig={domainConfig}
          />
        </Suspense>
      </div>

      {/* Features Section */}
      <div className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Our AI Search is Different
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Traditional job boards use keyword matching. We use advanced AI to understand 
              the meaning behind your search and find jobs that truly match what you want.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Semantic Understanding</h3>
              <p className="text-gray-600">
                Our AI understands context and meaning, not just keywords. 
                Search naturally and find exactly what you're looking for.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-600">
                Get results in under 3 seconds with our optimized search engine 
                and intelligent caching system.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Personalized Results</h3>
              <p className="text-gray-600">
                Machine learning algorithms learn from your preferences 
                to show you increasingly relevant job matches.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
