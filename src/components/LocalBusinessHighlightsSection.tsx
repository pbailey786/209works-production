import React, { useState, useEffect } from '@/components/ui/card';
import { motion } from 'framer-motion';


interface LocalBusiness {
  id: string;
  name: string;
  industry: string;
  location: string;
  activeJobs: number;
  description: string;
  logo?: string;
  website?: string;
}

export default function LocalBusinessHighlightsSection() {
  const [featuredBusinesses, setFeaturedBusinesses] = useState<LocalBusiness[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Fetch real employers from the database
  useEffect(() => {
    const fetchEmployers = async () => {
      try {
        const response = await fetch('/api/employers/featured');
        if (response.ok) {
          const data = await response.json();
          setFeaturedBusinesses(data.employers || []);
        } else {
          // Fallback to mock data if API fails
          setFeaturedBusinesses([
            {
              id: 'central-valley-health',
              name: 'Central Valley Health',
              industry: 'Healthcare',
              location: 'Stockton, CA',
              activeJobs: 12,
              description:
                'Leading healthcare provider serving the Central Valley with opportunities in nursing, administration, and medical support.',
              logo: '🏥',
            },
            {
              id: 'manteca-unified',
              name: 'Manteca Unified School District',
              industry: 'Education',
              location: 'Manteca, CA',
              activeJobs: 8,
              description:
                'Growing school district seeking teachers, administrators, and support staff to serve our diverse student community.',
              logo: '🎓',
            },
            {
              id: 'tracy-logistics',
              name: 'Tracy Logistics Solutions',
              industry: 'Transportation & Warehousing',
              location: 'Tracy, CA',
              activeJobs: 15,
              description:
                'Premier logistics company offering warehouse, transportation, and supply chain careers with competitive benefits.',
              logo: '🚛',
            },
            {
              id: 'lodi-wine-group',
              name: 'Lodi Wine Group',
              industry: 'Agriculture & Food',
              location: 'Lodi, CA',
              activeJobs: 6,
              description:
                'Family-owned winery and agricultural business with seasonal and full-time opportunities in wine production and farming.',
              logo: '🍇',
            },
            {
              id: 'modesto-tech',
              name: 'Modesto Tech Solutions',
              industry: 'Technology',
              location: 'Modesto, CA',
              activeJobs: 9,
              description:
                'Innovative tech company providing IT services to local businesses, seeking developers, support staff, and project managers.',
              logo: '💻',
            },
            {
              id: 'delta-construction',
              name: 'Delta Construction',
              industry: 'Construction',
              location: 'Stockton, CA',
              activeJobs: 11,
              description:
                'Established construction company building homes and commercial properties throughout the Central Valley region.',
              logo: '🏗️',
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching employers:', error);
        // Use fallback data on error
        setFeaturedBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployers();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section className="w-full bg-blue-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Local Employers Hiring Now
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Discover opportunities with established businesses and growing
            companies right here in the 209 area
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {featuredBusinesses.map((business, index) => (
            <motion.div
              key={business.id || index}
              className="rounded-lg bg-white p-6 shadow-md transition-shadow duration-200 hover:shadow-lg"
              variants={cardVariants}
            >
              <div className="mb-4 flex items-start justify-between">
                <Link
                  href={`/employers/${business.id}`}
                  className="flex cursor-pointer items-center transition-opacity hover:opacity-80"
                >
                  <div
                    className="mr-3 text-3xl"
                    role="img"
                    aria-label={business.industry}
                  >
                    {business.logo}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 transition-colors hover:text-blue-600">
                      {business.name}
                    </h3>
                    <p className="text-sm text-gray-600">{business.industry}</p>
                  </div>
                </Link>
                {business.activeJobs > 0 && (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    {business.activeJobs} Jobs
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="mb-2 flex items-center text-sm text-gray-600">
                  <svg
                    className="mr-1 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {business.location}
                </div>
                <p className="text-sm leading-relaxed text-gray-700">
                  {business.description}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  href={`/employers/${business.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View Profile →
                </Link>

                {business.activeJobs > 0 && (
                  <span className="text-xs text-gray-500">
                    {business.activeJobs} open position
                    {business.activeJobs !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-12 text-center">
          <p className="mb-6 text-sm text-gray-600">
            Want to showcase your business? Join our growing network of local
            employers.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/employers"
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-blue-700"
            >
              For Employers
            </a>
            <a
              href="/jobs"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
            >
              See All Companies
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
