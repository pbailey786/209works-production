'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Job } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  Bookmark,
  Share2,
  ChevronDown,
  ChevronUp,
  Send,
  User,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp,
  Users,
  Gift
} from 'lucide-react';

interface JobDetailRedesignedProps {
  job: Job;
  relatedJobs: Job[];
  isAuthenticated: boolean;
  isSaved: boolean;
  userId?: string;
  userRole?: string;
  isJobOwner?: boolean;
}

const formatJobType = (type: string): string => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

export default function JobDetailRedesigned({
  job,
  relatedJobs,
  isAuthenticated,
  isSaved,
  userId,
  userRole,
  isJobOwner
}: JobDetailRedesignedProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationData, setApplicationData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: ''
  });

  // Parse benefits from JSON if available
  const benefits = useMemo(() => {
    try {
      return job.benefits ? JSON.parse(job.benefits) : [];
    } catch {
      return job.benefits ? [{ title: job.benefits, icon: '🎁' }] : [];
    }
  }, [job.benefits]);

  // Check if description is long enough to need expansion
  const isLongDescription = job.description && job.description.length > 300;
  const displayDescription = showFullDescription || !isLongDescription 
    ? job.description 
    : job.description?.substring(0, 300) + '...';

  const handleApply = () => {
    if (!isAuthenticated) {
      window.location.href = '/sign-in?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    setShowApplicationForm(true);
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApplying(true);
    
    // TODO: Implement actual application submission
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    
    setIsApplying(false);
    setHasApplied(true);
    setShowApplicationForm(false);
  };

  const handleSave = async () => {
    // TODO: Implement save job functionality
    console.log('Save job:', job.id);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `Check out this job: ${job.title} at ${job.company}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  // Sticky apply button for mobile
  const StickyApplyButton = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:hidden z-40">
      <button
        onClick={handleApply}
        disabled={hasApplied}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
          hasApplied 
            ? 'bg-green-600 cursor-not-allowed' 
            : 'bg-orange-600 hover:bg-orange-700 active:scale-95'
        }`}
      >
        {hasApplied ? (
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Application Sent!</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Apply Now</span>
          </div>
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => window.history.back()}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Bookmark className="h-5 w-5" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 lg:p-8 pb-20 lg:pb-8">
        {/* Desktop Back Button */}
        <div className="hidden lg:block mb-6">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Jobs</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Company/Featured Badges */}
              {(job.socialMediaShoutout || job.placementBump) && (
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3">
                  <div className="flex items-center space-x-2 text-white text-sm">
                    {job.placementBump && (
                      <div className="flex items-center space-x-1 bg-white bg-opacity-20 px-2 py-1 rounded-full">
                        <Star className="h-3 w-3" />
                        <span className="text-xs font-medium">Featured</span>
                      </div>
                    )}
                    {job.socialMediaShoutout && (
                      <div className="flex items-center space-x-1 bg-white bg-opacity-20 px-2 py-1 rounded-full">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs font-medium">Promoted</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Job Title and Company */}
                <div className="mb-4">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {job.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">{job.company}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                  </div>
                </div>

                {/* Job Meta Information */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {job.salaryMin && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-green-800">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm font-medium">Salary</span>
                      </div>
                      <p className="text-green-900 font-semibold mt-1">
                        {job.salaryMin && job.salaryMax 
                          ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                          : `$${job.salaryMin.toLocaleString()}+`
                        }
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Type</span>
                    </div>
                    <p className="text-blue-900 font-semibold mt-1">
                      {formatJobType(job.jobType)}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-purple-800">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">Posted</span>
                    </div>
                    <p className="text-purple-900 font-semibold mt-1">
                      {formatDate(job.postedAt)}
                    </p>
                  </div>

                  {job.isRemote && (
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-orange-800">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Work Type</span>
                      </div>
                      <p className="text-orange-900 font-semibold mt-1 text-sm">
                        Remote
                      </p>
                    </div>
                  )}
                </div>

                {/* Desktop Apply Button */}
                <div className="hidden lg:block">
                  <button
                    onClick={handleApply}
                    disabled={hasApplied}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                      hasApplied 
                        ? 'bg-green-600 cursor-not-allowed' 
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    {hasApplied ? (
                      <div className="flex items-center justify-center space-x-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>Application Sent!</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Send className="h-5 w-5" />
                        <span>Apply for This Job</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Job Description Sections */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              {/* About This Role */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <span>About This Role</span>
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {displayDescription}
                  </p>
                  {isLongDescription && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="mt-3 text-orange-600 hover:text-orange-700 font-medium flex items-center space-x-1"
                    >
                      <span>{showFullDescription ? 'Show Less' : 'Read More'}</span>
                      {showFullDescription ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* What You'll Do */}
              {job.responsibilities && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>What You'll Do</span>
                  </h2>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {job.responsibilities}
                    </p>
                  </div>
                </div>
              )}

              {/* What We're Looking For */}
              {job.requirements && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-red-600" />
                    </div>
                    <span>What We're Looking For</span>
                  </h2>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {job.requirements}
                    </p>
                  </div>
                </div>
              )}

              {/* What We Offer */}
              {benefits.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Gift className="h-4 w-4 text-green-600" />
                    </div>
                    <span>What We Offer</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {benefits.map((benefit: any, index: number) => (
                      <div key={index} className="bg-green-50 rounded-lg p-3 flex items-center space-x-3">
                        <span className="text-lg">{benefit.icon || '🎁'}</span>
                        <span className="text-gray-700 font-medium">{benefit.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Desktop Save/Share Actions */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Job Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Bookmark className="h-4 w-4" />
                  <span>{isSaved ? 'Saved' : 'Save Job'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Job</span>
                </button>
              </div>
            </div>

            {/* Related Jobs */}
            {relatedJobs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Similar Jobs</h3>
                <div className="space-y-4">
                  {relatedJobs.slice(0, 3).map((relatedJob) => (
                    <div key={relatedJob.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                      <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {relatedJob.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">{relatedJob.company}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{relatedJob.location}</span>
                        <span>{formatDate(relatedJob.postedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Apply Button for Mobile */}
      <StickyApplyButton />

      {/* Application Modal */}
      <AnimatePresence>
        {showApplicationForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowApplicationForm(false)}
            />
            <div className="flex items-center justify-center min-h-screen p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Apply to {job.title}
                    </h3>
                    <button
                      onClick={() => setShowApplicationForm(false)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleApplicationSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={applicationData.fullName}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={applicationData.email}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={applicationData.phone}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cover Letter
                      </label>
                      <textarea
                        rows={4}
                        value={applicationData.coverLetter}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, coverLetter: e.target.value }))}
                        placeholder="Tell us why you're interested in this position..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowApplicationForm(false)}
                        className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isApplying}
                        className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                      >
                        {isApplying ? 'Sending...' : 'Send Application'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}