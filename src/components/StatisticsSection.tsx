import React, { useState, useEffect } from '@/components/ui/card';
import { motion } from 'framer-motion';


interface Statistics {
  totalJobs: number;
  activeJobs: number;
  totalCompanies: number;
  totalUsers: number;
  recentJobs: number; // Jobs posted in last 7 days
}

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k+';
  }
  return num.toString();
};

export default function StatisticsSection() {
  const [stats, setStats] = useState<Statistics>({
    totalJobs: 0,
    activeJobs: 0,
    totalCompanies: 0,
    totalUsers: 0,
    recentJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchStatistics = async () => {
      try {
        // Fetch real platform statistics
        const response = await fetch('/api/platform-stats', { signal });

        if (signal.aborted) return;

        if (response.ok) {
          const data = await response.json();
          setStats({
            totalJobs: data.totalJobs || 0,
            activeJobs: data.activeJobs || 0,
            totalCompanies: data.totalCompanies || 0,
            totalUsers: data.totalUsers || 0,
            recentJobs: data.recentJobs || 0,
          });
        } else {
          // Set zero stats if API fails
          setStats({
            totalJobs: 0,
            activeJobs: 0,
            totalCompanies: 0,
            totalUsers: 0,
            recentJobs: 0,
          });
        }
      } catch (error) {
        if (signal.aborted) return;
        console.error('Error fetching statistics:', error);
        // Set zero stats on error
        setStats({
          totalJobs: 0,
          activeJobs: 0,
          totalCompanies: 0,
          totalUsers: 0,
          recentJobs: 0,
        });
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchStatistics();

    // Cleanup function
    return () => {
      controller.abort();
    };
  }, []);

  const statisticsData = [
    {
      label: 'Local Jobs',
      value: formatNumber(stats.activeJobs),
      icon: '💼',
      description: 'Open positions in the 209 area',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      label: '209 Employers',
      value: formatNumber(stats.totalCompanies),
      icon: '🏢',
      description: 'Local businesses hiring',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Job Seekers',
      value: formatNumber(stats.totalUsers),
      icon: '👥',
      description: 'Central Valley professionals',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'New This Week',
      value: formatNumber(stats.recentJobs),
      icon: '🆕',
      description: 'Fresh local opportunities',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (loading) {
    return (
      <section className="w-full bg-gradient-to-br from-white via-emerald-50/30 to-blue-50/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                209 Jobs
              </span>{' '}
              by the Numbers
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="text-center">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
                  <div className="animate-pulse">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-200"></div>
                    <div className="mb-2 h-8 rounded bg-gray-200"></div>
                    <div className="mb-1 h-4 rounded bg-gray-200"></div>
                    <div className="h-3 rounded bg-gray-200"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-gradient-to-br from-white via-emerald-50/30 to-blue-50/30 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800">
            <span>📊</span>
            <span>Community Impact</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              209 Jobs
            </span>{' '}
            by the Numbers
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-gray-600">
            Join thousands of Central Valley professionals building careers
            close to home. Real jobs, real employers, real community impact.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-2 gap-8 md:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {statisticsData.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              variants={itemVariants}
            >
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:border-gray-200 hover:shadow-xl">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-16 w-16 ${stat.bgColor} mb-4 flex items-center justify-center rounded-full text-2xl`}
                    role="img"
                    aria-label={stat.label}
                  >
                    {stat.icon}
                  </div>
                  <div
                    className={`mb-2 text-3xl font-bold md:text-4xl ${stat.color}`}
                  >
                    {stat.value}
                  </div>
                  <div className="mb-1 text-lg font-semibold text-gray-900">
                    {stat.label}
                  </div>
                  <div className="text-center text-sm text-gray-600">
                    {stat.description}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-12 text-center">
          <p className="mb-6 text-sm text-gray-500">
            Updated daily • Join the growing community of Central Valley
            professionals
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/jobs"
              className="inline-flex transform items-center rounded-xl border border-transparent bg-gradient-to-r from-emerald-500 to-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-emerald-600 hover:to-blue-700 hover:shadow-xl"
            >
              Browse Local Jobs
            </a>
            <a
              href="/employers/create-job-post"
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 shadow-md transition-all duration-200 hover:bg-gray-50 hover:shadow-lg"
            >
              Post a Job
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
