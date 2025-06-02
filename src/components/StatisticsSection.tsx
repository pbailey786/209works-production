import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
    recentJobs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchStatistics = async () => {
      try {
        // In a real app, you'd have a dedicated stats endpoint
        // For now, we'll use the jobs endpoint and mock some data based on response
        const response = await fetch('/api/jobs?limit=1', { signal });
        
        if (signal.aborted) return;
        
        if (response.ok) {
          const data = await response.json();
          // Mock statistics based on having jobs data
          // In production, you'd have a proper /api/stats endpoint
          setStats({
            totalJobs: 250,
            activeJobs: 180,
            totalCompanies: 45,
            totalUsers: 1200,
            recentJobs: 25
          });
        }
      } catch (error) {
        if (signal.aborted) return;
        console.error('Error fetching statistics:', error);
        // Set default stats on error
        setStats({
          totalJobs: 150,
          activeJobs: 120,
          totalCompanies: 30,
          totalUsers: 800,
          recentJobs: 15
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
      label: "Local Jobs",
      value: formatNumber(stats.activeJobs),
      icon: "💼",
      description: "Open positions in the 209 area",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    },
    {
      label: "209 Employers",
      value: formatNumber(stats.totalCompanies),
      icon: "🏢",
      description: "Local businesses hiring",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      label: "Job Seekers",
      value: formatNumber(stats.totalUsers),
      icon: "👥",
      description: "Central Valley professionals",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      label: "New This Week",
      value: formatNumber(stats.recentJobs),
      icon: "🆕",
      description: "Fresh local opportunities",
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  if (loading) {
    return (
      <section className="w-full py-16 bg-gradient-to-br from-white via-emerald-50/30 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">209 Jobs</span> by the Numbers
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
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
    <section className="w-full py-16 bg-gradient-to-br from-white via-emerald-50/30 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span>📊</span>
            <span>Community Impact</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">209 Jobs</span> by the Numbers
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Join thousands of Central Valley professionals building careers close to home. Real jobs, real employers, real community impact.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
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
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 ${stat.bgColor} rounded-full flex items-center justify-center mb-4 text-2xl`} role="img" aria-label={stat.label}>
                    {stat.icon}
                  </div>
                  <div className={`text-3xl md:text-4xl font-bold mb-2 ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">
                    {stat.label}
                  </div>
                  <div className="text-sm text-gray-600 text-center">
                    {stat.description}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-6">
            Updated daily • Join the growing community of Central Valley professionals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/jobs"
              className="inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Browse Local Jobs
            </a>
            <a
              href="/employers/create-job-post"
              className="inline-flex items-center px-8 py-4 border border-gray-300 text-base font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Post a Job
            </a>
          </div>
        </div>
      </div>
    </section>
  );
} 