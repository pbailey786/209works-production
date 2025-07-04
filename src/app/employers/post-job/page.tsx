'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Wand2, 
  Edit, 
  ArrowRight, 
  Zap,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  Upload,
  FileText
} from 'lucide-react';
import PostJobWizard from '@/components/employers/PostJobWizard';
import JobPostUpsellModal from '@/components/employers/JobPostUpsellModal';

interface JobData {
  title: string;
  location: string;
  salary: string;
  description: string;
  responsibilities: string;
  requirements: string;
  contactMethod: string;
  schedule?: string;
  benefits?: string;
  requiresDegree?: boolean;
  customQuestions?: string[];
  company?: string;
  companyLogo?: string;
  benefitOptions?: Array<{
    icon: string;
    title: string;
    description: string;
    value: boolean;
    key: string;
  }>;
}

type FlowState = 'choose' | 'ai-input' | 'ai-generating' | 'wizard' | 'publishing';

export default function PostJobPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [flowState, setFlowState] = useState<FlowState>('choose');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [credits, setCredits] = useState<{ universal: number; total: number } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [publishedJobId, setPublishedJobId] = useState<string | null>(null);
  const [showUpsellModal, setShowUpsellModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch credits when user is loaded
  useEffect(() => {
    if (user) {
      Promise.all([
        fetch('/api/profile').then(res => res.ok ? res.json() : { user: null }),
        fetch('/api/job-posting/credits').then(res => res.ok ? res.json() : { credits: { universal: 0, total: 0 } })
      ])
      .then(([profileData, creditsData]) => {
        const baseJobData: JobData = {
          title: '',
          location: '',
          salary: '',
          description: '',
          responsibilities: '',
          requirements: '',
          contactMethod: user.emailAddresses?.[0]?.emailAddress || '',
          schedule: '',
          benefits: '',
          requiresDegree: false,
          customQuestions: [],
          company: profileData.user?.companyName || '',
          companyLogo: undefined,
          benefitOptions: []
        };
        setJobData(baseJobData);
        setCredits(creditsData.credits || { universal: 0, total: 0 });
      })
      .catch(err => {
        console.error('Failed to fetch user data:', err);
        setCredits({ universal: 0, total: 0 });
      });
    }
  }, [user]);

  // Authentication check
  if (!isLoaded || !isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  const generateJobWithAI = async () => {
    if (!aiPrompt.trim()) {
      alert('Please describe the job you want to create');
      return;
    }

    setIsGenerating(true);
    setFlowState('ai-generating');

    try {
      const response = await fetch('/api/employers/magic-job-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.jobData) {
          // Merge AI-generated data with existing user data
          const enhancedJobData: JobData = {
            ...jobData!,
            ...data.jobData,
            contactMethod: jobData?.contactMethod || user.emailAddresses?.[0]?.emailAddress || '',
            company: jobData?.company || data.jobData.company || '',
          };
          
          setJobData(enhancedJobData);
          setFlowState('wizard');
        } else {
          throw new Error(data.message || 'Failed to generate job posting');
        }
      } else {
        throw new Error('Failed to generate job posting');
      }
    } catch (error) {
      console.error('Error generating job:', error);
      alert('Failed to generate job posting. Please try again.');
      setFlowState('ai-input');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJobComplete = async (finalJobData: JobData) => {
    setIsPublishing(true);
    
    try {
      const response = await fetch('/api/employers/publish-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalJobData)
      });

      if (response.ok) {
        const data = await response.json();
        setPublishedJobId(data.jobId);
        setJobData(finalJobData);
        setShowUpsellModal(true);
        // Don't redirect immediately - let them see upsells first
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to publish job');
      }
    } catch (error) {
      console.error('Error publishing job:', error);
      alert('Failed to publish job. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUpsellPurchase = async (upsells: { featured: boolean; social: boolean }) => {
    if (!publishedJobId) return;
    
    try {
      const response = await fetch('/api/jobs/upsells', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: publishedJobId,
          featured: upsells.featured,
          social: upsells.social
        })
      });

      if (response.ok) {
        // Update credits after purchase
        const creditsResponse = await fetch('/api/job-posting/credits');
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json();
          setCredits(creditsData.credits);
        }
        
        // Redirect to job management
        router.push(`/employers/jobs/${publishedJobId}`);
      } else {
        throw new Error('Failed to purchase upsells');
      }
    } catch (error) {
      console.error('Upsell purchase failed:', error);
      alert('Failed to add premium features. Please try again.');
    }
  };

  const handleUpsellModalClose = () => {
    setShowUpsellModal(false);
    if (publishedJobId) {
      router.push(`/employers/jobs/${publishedJobId}`);
    }
  };

  const handleWizardCancel = () => {
    setFlowState('choose');
    setJobData({
      title: '',
      location: '',
      salary: '',
      description: '',
      responsibilities: '',
      requirements: '',
      contactMethod: user.emailAddresses?.[0]?.emailAddress || '',
      schedule: '',
      benefits: '',
      requiresDegree: false,
      customQuestions: [],
      company: jobData?.company || '',
      companyLogo: undefined,
      benefitOptions: []
    });
  };

  const startFromScratch = () => {
    setFlowState('wizard');
  };

  const startWithAI = () => {
    setFlowState('ai-input');
  };

  if (flowState === 'wizard' && jobData) {
    return (
      <PostJobWizard
        onComplete={handleJobComplete}
        onCancel={handleWizardCancel}
        initialData={jobData}
        credits={credits || undefined}
      />
    );
  }

  if (flowState === 'publishing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Publishing Your Job...</h2>
          <p className="text-gray-600">This will just take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Post a Job</h1>
            <p className="text-lg text-gray-600 mt-2">
              Find the perfect candidates for your open position
            </p>
            {credits && (
              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                <Sparkles className="h-4 w-4 mr-1" />
                {credits.universal} job posting credits available
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Choose Flow */}
        {flowState === 'choose' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* AI-Powered Option */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-4">
                    <Sparkles className="h-6 w-6" />
                    <span className="bg-white bg-opacity-20 text-xs font-medium px-2 py-1 rounded-full">
                      RECOMMENDED
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold mb-3">AI Job Builder</h2>
                  <p className="text-orange-100 mb-6 text-lg">
                    Describe your job in plain English. Our AI will create a professional job posting 
                    that attracts quality candidates from the Central Valley.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-orange-200" />
                      <span className="text-sm">2-3 minutes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-orange-200" />
                      <span className="text-sm">Optimized for 209</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-orange-200" />
                      <span className="text-sm">High response rate</span>
                    </div>
                  </div>
                  <button
                    onClick={startWithAI}
                    className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors flex items-center space-x-2"
                  >
                    <Wand2 className="h-5 w-5" />
                    <span>Start with AI</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="hidden lg:block ml-8">
                  <div className="w-32 h-32 bg-white bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-16 w-16 text-white opacity-50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Option */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Manual Job Builder</h2>
                  <p className="text-gray-600 mb-6">
                    Create your job posting step-by-step with our guided form. 
                    Perfect if you want full control over every detail.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">5-7 minutes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Edit className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Full control</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Step-by-step</span>
                    </div>
                  </div>
                  <button
                    onClick={startFromScratch}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center space-x-2"
                  >
                    <Edit className="h-5 w-5" />
                    <span>Start from scratch</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="hidden lg:block ml-8">
                  <div className="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <Edit className="h-16 w-16 text-gray-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Have existing description option */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <Upload className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Have an existing job description?</h3>
              </div>
              <p className="text-blue-700 mb-4">
                Upload or paste your current job posting and we'll help you optimize it for the Central Valley market.
              </p>
              <button
                onClick={() => {
                  setAiPrompt('I have an existing job description that I\'d like to optimize...');
                  setFlowState('ai-input');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Optimize existing description</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* AI Input */}
        {flowState === 'ai-input' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-orange-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Describe Your Job Opening
                </h2>
                <p className="text-gray-600">
                  Tell me about the position you're hiring for. I'll create a professional job posting for you.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Example: We need a warehouse worker for our Stockton location. 3-11 PM shift, $19/hour, forklift experience preferred. Benefits include health insurance and paid time off. Must be able to lift 50 lbs and work in fast-paced environment..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">
                      Include details like location, schedule, requirements, and benefits
                    </p>
                    <span className="text-xs text-gray-400">
                      {aiPrompt.length}/1000
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setFlowState('choose')}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={generateJobWithAI}
                    disabled={!aiPrompt.trim() || isGenerating}
                    className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Generate Job Post</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Generating */}
        {flowState === 'ai-generating' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-12">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Creating Your Job Post</h2>
              <p className="text-gray-600 mb-6">
                Our AI is analyzing your requirements and crafting a professional job posting...
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Analyzing job requirements</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Optimizing for Central Valley market</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
                  <span>Generating professional content</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Upsell Modal */}
      {showUpsellModal && publishedJobId && jobData && credits && (
        <JobPostUpsellModal
          isOpen={showUpsellModal}
          onClose={handleUpsellModalClose}
          jobId={publishedJobId}
          jobTitle={jobData.title}
          credits={credits}
          onPurchase={handleUpsellPurchase}
        />
      )}
    </div>
  );
}