'use client';

import React, { useState } from 'react';
import { X, Check, Edit3, Eye, EyeOff, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';

interface OptimizedJob {
  id: string;
  originalContent: string;
  optimizedContent: string;
  optimizationStatus: 'success' | 'fallback' | 'error';
  error?: string | null;
  metadata: {
    title: string;
    company: string;
    location: string;
    salary?: string;
    jobType?: string;
    experienceLevel?: string;
    remote?: boolean;
  };
}

interface JobApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: OptimizedJob[];
  currentJobIndex: number;
  onApprove: (jobData: any) => Promise<void>;
  onSkip: () => void;
  onEdit: (jobData: any) => void;
  creditsRemaining: number;
  isApproving: boolean;
}

export default function JobApprovalModal({
  isOpen,
  onClose,
  jobs,
  currentJobIndex,
  onApprove,
  onSkip,
  onEdit,
  creditsRemaining,
  isApproving,
}: JobApprovalModalProps) {
  const [useOptimized, setUseOptimized] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [showComparison, setShowComparison] = useState(true);

  if (!isOpen || !jobs.length || currentJobIndex >= jobs.length) {
    return null;
  }

  const currentJob = jobs[currentJobIndex];
  const progress = ((currentJobIndex + 1) / jobs.length) * 100;

  const handleApprove = async () => {
    const jobData = {
      id: currentJob.id,
      title: currentJob.metadata.title,
      company: currentJob.metadata.company,
      location: currentJob.metadata.location,
      description: isEditing ? editedContent : (useOptimized ? currentJob.optimizedContent : currentJob.originalContent),
      salary: currentJob.metadata.salary,
      jobType: currentJob.metadata.jobType,
      experienceLevel: currentJob.metadata.experienceLevel,
      remote: currentJob.metadata.remote,
      useOptimizedContent: useOptimized && !isEditing,
    };

    await onApprove(jobData);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(useOptimized ? currentJob.optimizedContent : currentJob.originalContent);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-6xl bg-white rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Review Job {currentJobIndex + 1} of {jobs.length}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CreditCard className="h-4 w-4" />
                <span>{creditsRemaining} credits remaining</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={onSkip}
                disabled={isApproving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Job {currentJobIndex + 1}</span>
              <span>{jobs.length} total jobs</span>
            </div>
          </div>

          {/* Job Metadata */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-900">{currentJob.metadata.title}</span>
                <p className="text-gray-600">{currentJob.metadata.company}</p>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>
                <p className="text-gray-900">{currentJob.metadata.location}</p>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <p className="text-gray-900">{currentJob.metadata.jobType || 'Full-time'}</p>
              </div>
              <div>
                <span className="text-gray-500">Salary:</span>
                <p className="text-gray-900">{currentJob.metadata.salary || 'Competitive'}</p>
              </div>
            </div>
          </div>

          {/* Content Comparison */}
          <div className="p-6">
            {/* Toggle Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  {showComparison ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>{showComparison ? 'Hide' : 'Show'} Comparison</span>
                </button>
                
                {!isEditing && (
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="radio"
                        checked={!useOptimized}
                        onChange={() => setUseOptimized(false)}
                        className="text-[#2d4a3e] focus:ring-[#2d4a3e]"
                      />
                      <span>Use Original</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="radio"
                        checked={useOptimized}
                        onChange={() => setUseOptimized(true)}
                        className="text-[#2d4a3e] focus:ring-[#2d4a3e]"
                      />
                      <span>Use AI-Optimized</span>
                    </label>
                  </div>
                )}
              </div>

              <button
                onClick={isEditing ? handleCancelEdit : handleEdit}
                className="flex items-center space-x-2 text-sm text-[#2d4a3e] hover:text-[#1d3a2e]"
              >
                <Edit3 className="h-4 w-4" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Content'}</span>
              </button>
            </div>

            {/* Content Display */}
            {isEditing ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Edit Job Description:
                </label>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={20}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e]/20"
                  placeholder="Enter job description..."
                />
                <div className="text-xs text-gray-500">
                  {editedContent.length} characters (minimum 50 required)
                </div>
              </div>
            ) : showComparison ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original Content */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">Original Content</h3>
                    {!useOptimized && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
                    <div className="whitespace-pre-wrap text-sm text-gray-700">
                      {currentJob.originalContent}
                    </div>
                  </div>
                </div>

                {/* Optimized Content */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">AI-Optimized Content</h3>
                    {useOptimized && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Selected
                      </span>
                    )}
                    {currentJob.optimizationStatus === 'fallback' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Template
                      </span>
                    )}
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 h-96 overflow-y-auto">
                    <div className="whitespace-pre-wrap text-sm text-gray-700">
                      {currentJob.optimizedContent}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {useOptimized ? 'AI-Optimized Content' : 'Original Content'}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-sm text-gray-700">
                    {useOptimized ? currentJob.optimizedContent : currentJob.originalContent}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-gray-200 p-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>This will use 1 credit</span>
              {creditsRemaining <= 5 && (
                <span className="text-amber-600 font-medium">
                  ({creditsRemaining} remaining)
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onSkip}
                disabled={isApproving}
                className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Skip This Job
              </button>
              
              <button
                onClick={handleApprove}
                disabled={isApproving || creditsRemaining <= 0 || (isEditing && editedContent.length < 50)}
                className="rounded-lg bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] px-6 py-2 font-medium text-white hover:from-[#1d3a2e] hover:to-[#e55a2b] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApproving ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    <span>Publishing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4" />
                    <span>Approve & Publish</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
