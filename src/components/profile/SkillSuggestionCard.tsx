'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  LightBulbIcon,
  ChartBarIcon,
  ClockIcon,
  MapPinIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  PlusIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  AcademicCapIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import {
  SparklesIcon as SparklesIconSolid,
  LightBulbIcon as LightBulbIconSolid,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';
import { FEATURES } from '../../lib/feature-flags';

interface SkillSuggestion {
  skill: string;
  category: 'Technical' | 'Soft' | 'Industry' | 'Certification';
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  localDemand: 'High' | 'Medium' | 'Low';
  learningResources: string[];
  timeToLearn: '1-3 months' | '3-6 months' | '6+ months';
}

interface SkillGapAnalysis {
  strengths: string[];
  gaps: string[];
  recommendations: string;
}

interface CentralValleyInsights {
  topInDemandSkills: string[];
  emergingTrends: string[];
  industryFocus: string;
}

interface SkillSuggestionsData {
  suggestedSkills: SkillSuggestion[];
  skillGapAnalysis: SkillGapAnalysis;
  centralValleyInsights: CentralValleyInsights;
}

interface SkillSuggestionCardProps {
  user: any;
  onSkillAdd?: (skill: string) => void;
  className?: string;
}

const categoryIcons = {
  Technical: BriefcaseIcon,
  Soft: StarIcon,
  Industry: ArrowTrendingUpIcon,
  Certification: AcademicCapIcon,
};

const priorityColors = {
  High: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800',
  },
  Medium: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200', 
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  Low: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700', 
    badge: 'bg-green-100 text-green-800',
  },
};

const demandColors = {
  High: 'text-green-600',
  Medium: 'text-yellow-600',
  Low: 'text-gray-500',
};

export default function SkillSuggestionCard({ 
  user, 
  onSkillAdd,
  className = '' 
}: SkillSuggestionCardProps) {
  const [suggestions, setSuggestions] = useState<SkillSuggestionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'analysis' | 'insights'>('suggestions');

  if (!FEATURES.AI_SKILL_SUGGESTIONS) {
    return null;
  }

  const generateSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile/skill-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentSkills: user?.skills || [],
          targetRole: user?.currentJobTitle,
          experienceLevel: 'Mid-level', // Could be determined from profile
          resumeContent: user?.educationExperience,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate skill suggestions');
      }

      const result = await response.json();
      setSuggestions(result.data);
    } catch (err) {
      console.error('Skill suggestions error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (skill: string) => {
    setAddedSkills(prev => new Set(prev).add(skill));
    onSkillAdd?.(skill);
  };

  const tabs = [
    { key: 'suggestions', label: 'AI Suggestions', icon: SparklesIcon },
    { key: 'analysis', label: 'Skill Gap', icon: ChartBarIcon },
    { key: 'insights', label: '209 Insights', icon: MapPinIcon },
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <SparklesIconSolid className="h-6 w-6 text-white mr-3" />
            <div>
              <h3 className="text-xl font-bold text-white">Skill Development Center</h3>
              <p className="text-purple-100 text-sm">Professional skills to boost your career in the 209</p>
            </div>
          </div>
          <button
            onClick={generateSuggestions}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <LightBulbIconSolid className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Analyzing...' : suggestions ? 'Refresh' : 'Get Suggestions'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center">
              <XMarkIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <ArrowPathIcon className="h-8 w-8 text-purple-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Analyzing your profile with AI...</p>
              <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!suggestions && !loading && !error && (
          <div className="text-center py-12">
            <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Enhance Your Professional Profile
            </h4>
            <p className="text-gray-600 mb-4">
              Get personalized skill recommendations to strengthen your resume and stand out to Central Valley employers
            </p>
            <button
              onClick={generateSuggestions}
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              <SparklesIconSolid className="h-4 w-4 mr-2" />
              Generate Suggestions
            </button>
          </div>
        )}

        {/* Suggestions Content */}
        {suggestions && (
          <div>
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'suggestions' && (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {suggestions.suggestedSkills.map((suggestion, index) => {
                    const CategoryIcon = categoryIcons[suggestion.category];
                    const priorityStyle = priorityColors[suggestion.priority];
                    const isAdded = addedSkills.has(suggestion.skill);
                    const isExpanded = expandedSuggestion === suggestion.skill;

                    return (
                      <motion.div
                        key={suggestion.skill}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`border-2 rounded-lg p-4 transition-all ${
                          isAdded ? 'border-green-300 bg-green-50' : priorityStyle.border + ' ' + priorityStyle.bg
                        }`}
                      >
                        {/* Skill Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <CategoryIcon className={`h-5 w-5 mr-3 ${priorityStyle.text}`} />
                            <div>
                              <h4 className="font-semibold text-gray-900">{suggestion.skill}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityStyle.badge}`}>
                                  {suggestion.priority} Priority
                                </span>
                                <span className="text-xs text-gray-500">{suggestion.category}</span>
                                <span className={`text-xs font-medium ${demandColors[suggestion.localDemand]}`}>
                                  {suggestion.localDemand} Demand
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setExpandedSuggestion(isExpanded ? null : suggestion.skill)}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <BookOpenIcon className="h-4 w-4" />
                            </button>
                            {!isAdded ? (
                              <button
                                onClick={() => handleAddSkill(suggestion.skill)}
                                className="flex items-center px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                <PlusIcon className="h-3 w-3 mr-1" />
                                Add
                              </button>
                            ) : (
                              <div className="flex items-center px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-lg">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Added
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Skill Reason */}
                        <p className="text-gray-700 text-sm mb-3 break-words">{suggestion.reason}</p>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-gray-200 pt-3 mt-3"
                            >
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    Time to Learn
                                  </h5>
                                  <p className="text-sm text-gray-600">{suggestion.timeToLearn}</p>
                                </div>
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                    <BookOpenIcon className="h-4 w-4 mr-1" />
                                    Learning Resources
                                  </h5>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {suggestion.learningResources.map((resource, idx) => (
                                      <li key={idx} className="flex items-start">
                                        <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 mt-2 flex-shrink-0" />
                                        <span className="break-words">{resource}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {activeTab === 'analysis' && (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Strengths */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="flex items-center font-semibold text-green-800 mb-3">
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Your Strengths
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.skillGapAnalysis.strengths.map((strength, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Skill Gaps */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="flex items-center font-semibold text-amber-800 mb-3">
                      <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
                      Areas for Growth
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.skillGapAnalysis.gaps.map((gap, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full"
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="flex items-center font-semibold text-blue-800 mb-3">
                      <LightBulbIcon className="h-5 w-5 mr-2" />
                      Career Recommendations
                    </h4>
                    <p className="text-blue-700">{suggestions.skillGapAnalysis.recommendations}</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'insights' && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Top In-Demand Skills */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="flex items-center font-semibold text-purple-800 mb-3">
                      <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
                      Hot Skills in the 209
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.centralValleyInsights.topInDemandSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full"
                        >
                          🔥 {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Emerging Trends */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h4 className="flex items-center font-semibold text-indigo-800 mb-3">
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      Emerging Trends
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.centralValleyInsights.emergingTrends.map((trend, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full"
                        >
                          ✨ {trend}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Industry Focus */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="flex items-center font-semibold text-gray-800 mb-3">
                      <MapPinIcon className="h-5 w-5 mr-2" />
                      Central Valley Industry Focus
                    </h4>
                    <p className="text-gray-700">{suggestions.centralValleyInsights.industryFocus}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}