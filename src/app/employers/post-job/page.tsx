'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Sparkles, Zap, ArrowRight, Edit, MapPin, DollarSign, Briefcase, User, Eye } from 'lucide-react';

interface JobData {
  title: string;
  location: string;
  salary: string;
  description: string;
  requirements: string;
  contactMethod: string;
  schedule?: string;
  benefits?: string;
  requiresDegree?: boolean;
}

type GenerationState = 'input' | 'generating' | 'editing' | 'publishing';

export default function PostJobPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [currentState, setCurrentState] = useState<GenerationState>('input');
  const [prompt, setPrompt] = useState('');
  const [jobData, setJobData] = useState<JobData>({
    title: '',
    location: '',
    salary: '',
    description: '',
    requirements: '',
    contactMethod: '',
    requiresDegree: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isRequirementsExpanded, setIsRequirementsExpanded] = useState(false);
  
  // Check if form is ready to publish
  const isReady = jobData.title && jobData.location && jobData.salary && jobData.contactMethod;

  // Helper functions for collapsible content
  const isContentLong = (text: string, limit = 300) => text.length > limit;
  const truncateContent = (text: string, limit = 300) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };

  // Authentication check
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  // Generate complete job posting from prompt
  const generateJobPost = async () => {
    if (!prompt.trim()) {
      alert('Please describe the job you need to post');
      return;
    }

    setIsGenerating(true);
    setCurrentState('generating');

    try {
      const response = await fetch('/api/employers/magic-job-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setJobData(data.jobData);
        setCurrentState('editing');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to generate job post');
        setCurrentState('input');
      }
    } catch (error) {
      console.error('Failed to generate job post:', error);
      alert('Failed to generate job post. Please try again.');
      setCurrentState('input');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle input changes in edit mode
  const handleInputChange = (field: keyof JobData, value: string | boolean) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };

  // Publish job
  const handlePublish = async () => {
    if (!jobData.title || !jobData.location || !jobData.salary || !jobData.contactMethod) {
      alert('Please fill in job title, location, salary, and contact method');
      return;
    }
    
    setIsPublishing(true);
    try {
      const response = await fetch('/api/employers/publish-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      
      if (response.ok) {
        const data = await response.json();
        router.push(`/employers/jobs/${data.jobId}?published=true`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to publish job');
      }
    } catch (error) {
      console.error('Failed to publish:', error);
      alert('Failed to publish job. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Go back to start over
  const startOver = () => {
    setCurrentState('input');
    setPrompt('');
    setJobData({
      title: '',
      location: '',
      salary: '',
      description: '',
      requirements: '',
      contactMethod: '',
      requiresDegree: false
    });
  };

  // Render different states
  if (currentState === 'input') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-4xl mx-auto p-8 text-center">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Magic Job Creator</h1>
            <p className="text-xl text-gray-600">Describe your job need in plain English. Our AI will create a professional posting instantly.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl mx-auto">
            <div className="mb-6">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. We need a warehouse worker in Stockton for $18/hr, day shift, must be reliable and able to lift 50lbs. No experience needed, we'll train."
                className="w-full h-32 px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">{prompt.length}/500 characters</span>
                <div className="flex gap-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✨ Include salary</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">📍 Mention location</span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">⏰ Add schedule</span>
                </div>
              </div>
            </div>

            <button
              onClick={generateJobPost}
              disabled={!prompt.trim() || isGenerating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-semibold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3"
            >
              {isGenerating ? (
                <>
                  <div className="w-6 h-6 animate-spin rounded-full border-b-2 border-white"></div>
                  <span>Creating magic...</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  <span>Generate Job Post</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>AI writes professional description</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Adds Central Valley market rates</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Includes local business touches</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-gray-500">
            <p className="text-sm">🌾 Optimized for Central Valley • Stockton • Modesto • Fresno • Tracy</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentState === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto flex items-center justify-center animate-pulse">
                <Sparkles className="w-16 h-16 text-white" />
              </div>
              <div className="absolute inset-0 w-32 h-32 border-4 border-blue-200 rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Creating Your Job Post...</h2>
          <p className="text-lg text-gray-600 mb-8">Our AI is crafting a professional posting that attracts great Central Valley candidates</p>
          <div className="max-w-md mx-auto">
            <div className="space-y-3 text-left text-gray-600">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Analyzing your requirements...</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <span>Adding Central Valley market insights...</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <span>Writing professional description...</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
                <span>Finalizing job details...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentState === 'editing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">✨ Your Job Post is Ready!</h1>
            <p className="text-gray-600">Review and edit as needed, then publish to reach Central Valley job seekers</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Side - Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="space-y-6">
              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Job Title *
                </label>
                <input
                  type="text"
                  value={jobData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g. Cashier, Warehouse Associate, Driver"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location *
                </label>
                <input
                  type="text"
                  value={jobData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g. Stockton, CA"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Salary *
                </label>
                <input
                  type="text"
                  value={jobData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  placeholder="e.g. $15/hr, $16-18/hr, $35,000/year"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description
                </label>
                <textarea
                  value={jobData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="e.g. 'Join our family-owned business in Stockton. We need a reliable warehouse worker for day shift. You'll load trucks, manage inventory, and work with a tight-knit team. Great for someone who wants steady work close to home.'"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">💡 Tip: Mention local benefits like "close to home," "family-owned," or "Central Valley roots"</span>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements (Optional)
                </label>
                <textarea
                  value={jobData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  placeholder="e.g. Must be 18+, Valid driver's license, etc."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Contact Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  How to Apply *
                </label>
                <input
                  type="text"
                  value={jobData.contactMethod}
                  onChange={(e) => handleInputChange('contactMethod', e.target.value)}
                  placeholder="your-email@company.com or (555) 123-4567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    📧 <strong>Email applications:</strong> Candidates will apply through 209jobs AND we'll forward their application to your email<br/>
                    📱 <strong>Phone applications:</strong> Candidates will call you directly<br/>
                    🌟 <strong>Bonus:</strong> All applications get saved to your employer dashboard for easy tracking
                  </p>
                </div>
              </div>

              {/* Degree Requirement Checkbox */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={jobData.requiresDegree || false}
                    onChange={(e) => handleInputChange('requiresDegree', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    🎓 This position requires a college degree
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  This helps us match qualified candidates and filter applications
                </p>
              </div>

              {/* Power Enhancement Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Power Enhancements - One-Click Job Upgrades
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Row 1: Language & Local */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!jobData.description.includes('Bilingual')) {
                        handleInputChange('description', jobData.description + '\n\nBilingual (English/Spanish) strongly preferred for this role.');
                      }
                    }}
                    className="inline-flex items-center justify-start px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-300"
                  >
                    💬 <span className="ml-2">Add bilingual requirement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const city = jobData.location.split(',')[0];
                      if (!jobData.description.includes('commute') && !jobData.description.includes('Highway')) {
                        handleInputChange('description', jobData.description + `\n\nEasy commute from Highway 99 - perfect for ${city} and surrounding areas.`);
                      }
                    }}
                    className="inline-flex items-center justify-start px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-300"
                  >
                    🛣️ <span className="ml-2">Add commute details</span>
                  </button>

                  {/* Row 2: Work Environment */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!jobData.description.includes('training') && !jobData.description.includes('train')) {
                        handleInputChange('description', jobData.description + '\n\n✅ Full training provided - no experience required!');
                      }
                    }}
                    className="inline-flex items-center justify-start px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-green-50 hover:border-green-300"
                  >
                    🎓 <span className="ml-2">Add "training provided"</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!jobData.description.includes('overtime') && !jobData.description.includes('OT')) {
                        handleInputChange('description', jobData.description + '\n\n💰 Overtime opportunities available - earn extra!');
                      }
                    }}
                    className="inline-flex items-center justify-start px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-green-50 hover:border-green-300"
                  >
                    💰 <span className="ml-2">Add overtime opportunities</span>
                  </button>

                  {/* Row 3: Benefits & Perks */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!jobData.description.includes('benefits') && !jobData.description.includes('health')) {
                        handleInputChange('description', jobData.description + '\n\n🏥 Benefits: Health insurance, paid time off, and 401k matching.');
                      }
                    }}
                    className="inline-flex items-center justify-start px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-purple-50 hover:border-purple-300"
                  >
                    🏥 <span className="ml-2">Add benefits package</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!jobData.description.includes('start immediately') && !jobData.description.includes('ASAP')) {
                        handleInputChange('description', jobData.description + '\n\n⚡ Start immediately! We have multiple openings.');
                      }
                    }}
                    className="inline-flex items-center justify-start px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-orange-50 hover:border-orange-300"
                  >
                    ⚡ <span className="ml-2">Add "start immediately"</span>
                  </button>

                  {/* Row 4: Work Environment Specifics */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!jobData.description.includes('team') && !jobData.description.includes('family')) {
                        handleInputChange('description', jobData.description + '\n\n👥 Join a tight-knit team that feels like family.');
                      }
                    }}
                    className="inline-flex items-center justify-start px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-yellow-50 hover:border-yellow-300"
                  >
                    👥 <span className="ml-2">Add team culture</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!jobData.description.includes('physical') && !jobData.description.includes('active')) {
                        handleInputChange('description', jobData.description + '\n\n💪 This is an active, physical role - great for staying fit!');
                      }
                    }}
                    className="inline-flex items-center justify-start px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-red-50 hover:border-red-300"
                  >
                    💪 <span className="ml-2">Add physical work note</span>
                  </button>

                  {/* Row 5: Special Additions */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!jobData.description.includes('drug test') && !jobData.description.includes('background')) {
                        handleInputChange('requirements', (jobData.requirements || '') + '\n• Must pass background check and drug screening');
                      }
                    }}
                    className="inline-flex items-center justify-start px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 hover:border-gray-400"
                  >
                    🔒 <span className="ml-2">Add screening requirements</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!jobData.description.includes('advancement') && !jobData.description.includes('promotion')) {
                        handleInputChange('description', jobData.description + '\n\n📈 Clear advancement opportunities - promote from within!');
                      }
                    }}
                    className="inline-flex items-center justify-start px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-indigo-50 hover:border-indigo-300"
                  >
                    📈 <span className="ml-2">Add growth opportunities</span>
                  </button>
                </div>
                
                {/* Pro Tip & Clear Button */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded-lg mr-3">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Pro Tip:</strong> Use 3-4 enhancements max. Popular combos: Training + Benefits + Team Culture, or Bilingual + Commute + Start Immediately
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Reset to original AI generated content
                      setCurrentState('generating');
                      setTimeout(() => {
                        generateJobPost();
                      }, 100);
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t space-y-3">
              <button
                onClick={handlePublish}
                disabled={!isReady || isPublishing}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-lg font-medium text-lg transition-all ${
                  isReady && !isPublishing
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isPublishing ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>🚀 Post Job - 1 Credit</span>
                  </>
                )}
              </button>
              <button
                onClick={startOver}
                disabled={isPublishing}
                className="w-full px-6 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                ← Start Over with New Prompt
              </button>
              <p className="text-xs text-gray-500 text-center">
                {isReady ? 'Ready to publish!' : 'Fill in required fields to continue'}
              </p>
            </div>
            </div>

            {/* Right Side - Live Preview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-green-600" />
              How It Looks to Central Valley Job Seekers
            </h3>

            {!jobData.title ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Start typing to see your job post preview</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6">
                {/* Job Header */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{jobData.title}</h2>
                  <div className="flex items-center space-x-4 text-gray-600 mt-2">
                    {jobData.location && (
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {jobData.location}
                      </span>
                    )}
                    {jobData.salary && (
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {jobData.salary}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {jobData.description && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Job Description</h4>
                      {isContentLong(jobData.description) && (
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          {isDescriptionExpanded ? '▲ Show less' : '▼ Show more'}
                        </button>
                      )}
                    </div>
                    <div className={`text-gray-700 whitespace-pre-wrap ${isContentLong(jobData.description) && !isDescriptionExpanded ? 'max-h-24 overflow-hidden' : ''}`}>
                      {isContentLong(jobData.description) && !isDescriptionExpanded 
                        ? truncateContent(jobData.description)
                        : jobData.description
                      }
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {jobData.requirements && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Requirements</h4>
                      {isContentLong(jobData.requirements, 200) && (
                        <button
                          onClick={() => setIsRequirementsExpanded(!isRequirementsExpanded)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          {isRequirementsExpanded ? '▲ Show less' : '▼ Show more'}
                        </button>
                      )}
                    </div>
                    <div className={`text-gray-700 whitespace-pre-wrap ${isContentLong(jobData.requirements, 200) && !isRequirementsExpanded ? 'max-h-20 overflow-hidden' : ''}`}>
                      {isContentLong(jobData.requirements, 200) && !isRequirementsExpanded 
                        ? truncateContent(jobData.requirements, 200)
                        : jobData.requirements
                      }
                    </div>
                  </div>
                )}

                {/* Degree Requirement Badge */}
                {jobData.requiresDegree && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      🎓 College Degree Required
                    </span>
                  </div>
                )}

                {/* Apply Button - No Contact Info Shown */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-900 mb-1">Ready to Apply?</h4>
                      <p className="text-green-800 text-sm">Submit your application through 209jobs</p>
                    </div>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                      📝 Apply Now
                    </button>
                  </div>
                  {jobData.contactMethod && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <span className="text-xs text-green-700">
                        ✉️ Applications go to our CRM + employer gets email notification
                      </span>
                    </div>
                  )}
                </div>

                {/* Central Valley Specific Features Preview */}
                {jobData.title && jobData.location && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">🌟 209jobs Exclusive Features</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-center space-x-2">
                        <span>🧭</span>
                        <span>Commute time from major Central Valley cities</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>💭</span>
                        <span>"Should I Apply?" AI matching for this position</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>📚</span>
                        <span>Option to include .works career story</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>🏆</span>
                        <span>Profile gamification for local job seekers</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        </div>
        
        {/* Start Over Fab Button - Bottom Right */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={startOver}
            disabled={isPublishing}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all text-sm disabled:opacity-50"
          >
            ✨ New Prompt
          </button>
        </div>
      </div>
    );
  }

  // Publishing state (simple loading screen)
  if (currentState === 'publishing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-32 h-32 bg-gradient-to-r from-green-600 to-blue-600 rounded-full mx-auto flex items-center justify-center animate-pulse">
              <Sparkles className="w-16 h-16 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Publishing Your Job...</h2>
          <p className="text-lg text-gray-600">Your job post will be live in seconds!</p>
        </div>
      </div>
    );
  }

  return null;
}