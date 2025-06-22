'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  X,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import AdDisplay from '../../components/ads/AdDisplay';
import JobPagination from '../../components/job-search/JobPagination';

import EnhancedJobCard from '../../components/job-search/EnhancedJobCard';
import { FEATURES } from '../../lib/feature-flags';
import { DisabledFeature } from '../../lib/feature-flags-ui';

const suggestions = [
  'Full time warehouse jobs in Stockton',
  'School janitor roles in Lodi',
  'Delivery driver openings in Modesto',
  'Part time retail cashier jobs in Tracy',
  'Forklift operator in Manteca',
];

const jobTypes = [
  { value: '', label: 'All Types' },
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

const experienceLevels = [
  { value: '', label: 'All Levels' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'executive', label: 'Executive' },
];

const datePostedOptions = [
  { value: '', label: 'Any Time' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
];

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'date', label: 'Date Posted' },
  { value: 'salary', label: 'Salary' },
  { value: 'distance', label: 'Distance' },
];

interface SearchFilters {
  query: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salaryMin: string;
  salaryMax: string;
  remote: boolean;
  datePosted: string;
  sortBy: string;
}

// Component that uses search params - needs to be wrapped in Suspense
function JobsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // If AI features are disabled, show simplified version
  if (!FEATURES.AI_CHAT) {
    return <SimpleJobSearch />;
  }

  // Search state
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('query') || searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    jobType: searchParams.get('jobType') || '',
    experienceLevel: searchParams.get('experienceLevel') || '',
    salaryMin: searchParams.get('salaryMin') || '',
    salaryMax: searchParams.get('salaryMax') || '',
    remote: searchParams.get('remote') === 'true',
    datePosted: searchParams.get('datePosted') || '',
    sortBy: searchParams.get('sortBy') || 'relevance',
  });

  // UI state
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Chat-style conversation state
  const [conversation, setConversation] = useState<
    Array<{
      id: string;
      type: 'user' | 'assistant';
      content: string;
      timestamp: Date;
      jobs?: any[];
      metadata?: any;
    }>
  >([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Legacy AI response state (for backward compatibility)
  const [aiResponse, setAiResponse] = useState<string>('');
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1')
  );
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Placeholder rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % suggestions.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Function to save search to history
  const saveSearchHistory = useCallback(async (query: string, filters: any) => {
    if (!query.trim()) return;

    try {
      await fetch('/api/search-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          filters: filters,
        }),
      });
    } catch (error) {
      console.error('Failed to save search history:', error);
      // Don't fail the search if history saving fails
    }
  }, []);

  // Hybrid LLM + fallback search function
  const performSearch = useCallback(
    async (searchFilters: SearchFilters, page: number = 1) => {
      setLoading(true);
      setError('');
      setAiResponse('');
      setFollowUpQuestions([]);

      // Save search to history (only for new searches, not pagination)
      if (page === 1 && searchFilters.query) {
        await saveSearchHistory(searchFilters.query, {
          location: searchFilters.location,
          jobType: searchFilters.jobType,
          experienceLevel: searchFilters.experienceLevel,
          salaryMin: searchFilters.salaryMin,
          salaryMax: searchFilters.salaryMax,
          remote: searchFilters.remote,
          datePosted: searchFilters.datePosted,
          sortBy: searchFilters.sortBy,
        });
      }

      try {
        // First, try the LLM job search endpoint for natural language processing
        const requestBody = {
          userMessage: searchFilters.query,
          conversationHistory: [], // Could be enhanced to maintain conversation context
          filters: {
            location: searchFilters.location,
            jobType: searchFilters.jobType,
            experienceLevel: searchFilters.experienceLevel,
            salaryMin: searchFilters.salaryMin
              ? parseInt(searchFilters.salaryMin)
              : undefined,
            salaryMax: searchFilters.salaryMax
              ? parseInt(searchFilters.salaryMax)
              : undefined,
            remote: searchFilters.remote,
            datePosted: searchFilters.datePosted,
          },
        };

        console.log('Attempting LLM Search:', requestBody);

        const llmRes = await fetch('/api/llm-job-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const llmData = await llmRes.json();
        console.log('LLM Search Response:', llmData);

        if (llmRes.ok && llmData.jobs) {
          // LLM search succeeded
          const jobs = llmData.jobs || [];
          setJobs(jobs);

          // Set AI response for conversational feedback
          if (llmData.summary) {
            setAiResponse(llmData.summary);
          }

          // Set follow-up questions if available
          if (
            llmData.followUpQuestions &&
            llmData.followUpQuestions.length > 0
          ) {
            setFollowUpQuestions(llmData.followUpQuestions);
          }

          // Update pagination info (LLM search doesn't use traditional pagination)
          setTotalPages(1);
          setTotalResults(jobs.length);
          setCurrentPage(1);

          return jobs;
        } else {
          // LLM search failed, fall back to regular search
          console.log('LLM search failed, falling back to regular search');

          const params = new URLSearchParams({
            q: searchFilters.query,
            limit: '20',
            page: page.toString(),
            useRelevanceScoring: 'true',
            includeSnippets: 'true',
            sortBy: searchFilters.sortBy,
          });

          if (searchFilters.location)
            params.set('location', searchFilters.location);
          if (searchFilters.jobType)
            params.set('jobType', searchFilters.jobType);
          if (searchFilters.experienceLevel)
            params.set('experienceLevel', searchFilters.experienceLevel);
          if (searchFilters.salaryMin)
            params.set('salaryMin', searchFilters.salaryMin);
          if (searchFilters.salaryMax)
            params.set('salaryMax', searchFilters.salaryMax);
          if (searchFilters.remote) params.set('remote', 'true');
          if (searchFilters.datePosted)
            params.set('datePosted', searchFilters.datePosted);

          const fallbackRes = await fetch(`/api/jobs/search?${params}`);
          const fallbackData = await fallbackRes.json();

          console.log('Fallback Search Response:', fallbackData);

          if (fallbackRes.ok) {
            // Handle the nested response structure: data.data[].item
            const searchResults = fallbackData.data?.data || [];
            const jobItems = searchResults.map(
              (result: any) => result.item || result
            );
            setJobs(jobItems);

            // Set a basic AI-style response for the fallback
            setAiResponse(
              `I found ${jobItems.length} jobs matching "${searchFilters.query}" using enhanced search. While our AI analysis is temporarily unavailable, these results are ranked by relevance to help you find the best opportunities in the 209 area.`
            );

            // Update pagination info
            const pagination = fallbackData.data?.pagination || {};
            setTotalPages(pagination.totalPages || 1);
            setTotalResults(pagination.totalCount || jobItems.length);
            setCurrentPage(page);

            return jobItems;
          } else {
            setError(fallbackData.error || 'Search failed');
            setJobs([]);
            setTotalPages(1);
            setTotalResults(0);
            return [];
          }
        }
      } catch (error) {
        console.error('Search error:', error);
        setError('Failed to search for jobs');
        setJobs([]);
        setTotalPages(1);
        setTotalResults(0);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [saveSearchHistory]
  );

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: SearchFilters, page: number = 1) => {
      const params = new URLSearchParams();

      if (newFilters.query) params.set('q', newFilters.query);
      if (newFilters.location) params.set('location', newFilters.location);
      if (newFilters.jobType) params.set('jobType', newFilters.jobType);
      if (newFilters.experienceLevel)
        params.set('experienceLevel', newFilters.experienceLevel);
      if (newFilters.salaryMin) params.set('salaryMin', newFilters.salaryMin);
      if (newFilters.salaryMax) params.set('salaryMax', newFilters.salaryMax);
      if (newFilters.remote) params.set('remote', 'true');
      if (newFilters.datePosted)
        params.set('datePosted', newFilters.datePosted);
      if (newFilters.sortBy !== 'relevance')
        params.set('sortBy', newFilters.sortBy);
      if (page > 1) params.set('page', page.toString());

      const url = `/jobs${params.toString() ? `?${params.toString()}` : ''}`;
      router.replace(url, { scroll: false });
    },
    [router]
  );

  // Chat-style message handling
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      // Save search to history
      await saveSearchHistory(message.trim(), {
        searchType: 'chat',
        timestamp: new Date().toISOString(),
      });

      const userMessage = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'user' as const,
        content: message.trim(),
        timestamp: new Date(),
      };

      // Add user message to conversation
      setConversation(prev => [...prev, userMessage]);
      setCurrentMessage('');
      setIsTyping(true);
      setHasSearched(true);

      try {
        // Call the chat API with conversation history
        const response = await fetch('/api/chat-job-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userMessage: message.trim(),
            conversationHistory: conversation,
            userProfile: null,
            sessionId: 'user-session',
          }),
        });

        const data = await response.json();

        // Always try to use the response, even if status is not ok
        if (data.response) {
          // Add assistant response to conversation
          const assistantMessage = {
            id: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'assistant' as const,
            content: data.response,
            timestamp: new Date(),
            jobs: data.jobs || [],
            metadata: data.metadata,
          };

          setConversation(prev => [...prev, assistantMessage]);
          setJobs(data.jobs || []);
          setTotalResults(data.jobs?.length || 0);
          setFollowUpQuestions(data.followUpQuestions || []);

          // Update URL for sharing
          const newFilters = { ...filters, query: message.trim() };
          setFilters(newFilters);
          updateURL(newFilters, 1);
        } else if (response.ok) {
          // Fallback for successful responses without data.response
          const assistantMessage = {
            id: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'assistant' as const,
            content: data.error || "I'm here to help with your job search in the 209 area! What would you like to know?",
            timestamp: new Date(),
            jobs: [],
            metadata: {},
          };
          setConversation(prev => [...prev, assistantMessage]);
        } else {
          throw new Error(data.error || 'Failed to search');
        }
      } catch (error) {
        console.error('Chat search error:', error);
        // Provide a helpful fallback response instead of an error
        const fallbackMessage = {
          id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'assistant' as const,
          content: "Hey there! I'm here to help you find work in the 209 area - Stockton, Modesto, Tracy, and all around the Central Valley. Been helping folks find good jobs around here for a while. What kind of work are you looking for?",
          timestamp: new Date(),
        };
        setConversation(prev => [...prev, fallbackMessage]);

        // Add some helpful follow-up questions
        setFollowUpQuestions([
          'What job opportunities are available in the 209 area?',
          'Tell me about working in the Central Valley',
          'What career advice do you have?'
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [conversation, filters, updateURL, saveSearchHistory]
  );

  // Handle follow-up question clicks
  const handleFollowUpQuestion = (question: string) => {
    sendMessage(question);
  };

  // Legacy search handler for backward compatibility
  const handleSearch = (query: string) => {
    sendMessage(query);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL(filters, page);
    performSearch(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear search and start new conversation
  const handleNewSearch = () => {
    setJobs([]);
    setHasSearched(false);
    setAiResponse('');
    setFollowUpQuestions([]);
    setConversation([]);
    setCurrentMessage('');
    setIsTyping(false);
    setFilters({
      query: '',
      location: '',
      jobType: '',
      experienceLevel: '',
      salaryMin: '',
      salaryMax: '',
      remote: false,
      datePosted: '',
      sortBy: 'relevance',
    });
    router.replace('/jobs');
  };

  // Auto-trigger chat search when URL has query parameters
  useEffect(() => {
    const query = searchParams.get('q') || searchParams.get('query');
    if (query && !hasSearched && conversation.length === 0) {
      // Automatically send the query from homepage to chat
      sendMessage(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, hasSearched, conversation.length]);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'query' || key === 'location' || key === 'sortBy') return false;
    if (key === 'remote') return value === true;
    return value !== '';
  }).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
              JobsGPT: Smart Local Job Search
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
              Powered by AI. Focused on Central California.
            </p>

            {hasSearched && (
              <Button
                variant="outline"
                onClick={handleNewSearch}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                New Search
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Chat Interface - Full Width */}
        <div className="flex min-h-[600px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Chat Header - Simplified */}
          {conversation.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#2d4a3e] to-[#1a3329]">
                <span className="text-xl font-bold text-white">AI</span>
              </div>
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                JobsGPT: Smart Local Job Search
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
                Ask me about jobs in the 209 area. I can help you find local opportunities in Stockton, Modesto, Tracy, and surrounding cities. Try asking about specific roles, companies, or job types!
              </p>

              {/* Suggestion Pills */}
              <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  'Show me warehouse jobs in Stockton',
                  'Find nursing jobs near Tracy',
                  'What customer service jobs are available?',
                  'All jobs in Modesto',
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-left text-gray-700 transition-all duration-200 hover:border-[#2d4a3e] hover:bg-[#2d4a3e]/5 hover:text-[#2d4a3e]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages Area */}
          {conversation.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
                {conversation.map(message => (
                  <div key={message.id} className="space-y-6">
                    {/* User Message - Right Side with Shadow */}
                    {message.type === 'user' && (
                      <div className="flex items-start justify-end gap-4">
                        <div className="max-w-3xl flex-1">
                          <div className="ml-auto max-w-fit rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 shadow-sm">
                            <p className="text-base leading-relaxed text-gray-900">
                              {message.content}
                            </p>
                          </div>
                        </div>
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-700">
                          <span className="text-sm font-medium text-white">
                            U
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Assistant Message - Left Side */}
                    {message.type === 'assistant' && (
                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#2d4a3e] to-[#1a3329]">
                          <span className="text-sm font-bold text-white">
                            AI
                          </span>
                        </div>
                        <div className="max-w-4xl flex-1">
                          <div className="prose prose-gray max-w-none">
                            <p className="mb-4 text-base leading-relaxed text-gray-900">
                              {message.content}
                            </p>

                            {/* Show first few jobs in chat - Enhanced with clickable cards */}
                            {message.jobs && message.jobs.length > 0 && (
                              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                                  <svg
                                    className="h-4 w-4 text-[#2d4a3e]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                                    />
                                  </svg>
                                  Top {Math.min(3, message.jobs.length)}{' '}
                                  Results:
                                </h4>
                                <div className="space-y-3">
                                  {message.jobs
                                    .slice(0, 3)
                                    .map((job, index) => (
                                      <div
                                        key={`chat-job-${job.id || `${index}-${Date.now()}`}`}
                                        onClick={() => {
                                          console.log('Job clicked:', job);
                                          if (job.id) {
                                            window.open(
                                              `/jobs/${job.id}`,
                                              '_blank'
                                            );
                                          } else {
                                            console.warn(
                                              'Job ID is missing:',
                                              job
                                            );
                                          }
                                        }}
                                        className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-[#2d4a3e] hover:shadow-md"
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <h5 className="mb-1 font-semibold text-gray-900 transition-colors group-hover:text-[#2d4a3e]">
                                              {job.title}
                                            </h5>
                                            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                                              <span className="font-medium">
                                                {job.company}
                                              </span>
                                              <span>•</span>
                                              <span>{job.location}</span>
                                              {job.jobType && (
                                                <>
                                                  <span>•</span>
                                                  <span className="capitalize">
                                                    {job.jobType.replace(
                                                      '_',
                                                      ' '
                                                    )}
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                            {job.salaryMin && job.salaryMax && (
                                              <div className="mb-2 flex items-center gap-1">
                                                <svg
                                                  className="h-4 w-4 text-green-600"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                                  />
                                                </svg>
                                                <span className="text-sm font-semibold text-green-600">
                                                  $
                                                  {job.salaryMin.toLocaleString()}{' '}
                                                  - $
                                                  {job.salaryMax.toLocaleString()}
                                                </span>
                                              </div>
                                            )}
                                            {job.description && (
                                              <p className="line-clamp-2 text-sm text-gray-600">
                                                {job.description.length > 120
                                                  ? job.description.substring(
                                                      0,
                                                      120
                                                    ) + '...'
                                                  : job.description}
                                              </p>
                                            )}
                                          </div>
                                          <div className="ml-3 flex-shrink-0">
                                            <svg
                                              className="h-5 w-5 text-gray-400 transition-colors group-hover:text-[#2d4a3e]"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                              />
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                                {message.jobs.length > 3 && (
                                  <div className="mt-4 border-t border-gray-200 pt-3">
                                    <p className="text-center text-sm text-gray-600">
                                      <span className="font-medium">
                                        + {message.jobs.length - 3} more jobs
                                      </span>{' '}
                                      shown below
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#2d4a3e] to-[#1a3329]">
                      <span className="text-sm font-bold text-white">AI</span>
                    </div>
                    <div className="max-w-4xl flex-1">
                      <div className="inline-block rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                          <div
                            className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                            style={{ animationDelay: '0.1s' }}
                          ></div>
                          <div
                            className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                            style={{ animationDelay: '0.2s' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message Input - ChatGPT Style */}
          <div className="border-t border-gray-200 p-6">
            <div className="mx-auto max-w-5xl">
              <div className="relative">
                <textarea
                  value={currentMessage}
                  onChange={e => setCurrentMessage(e.target.value)}
                  placeholder="Ask anything about jobs in the 209 area..."
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-12 text-lg leading-relaxed focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e]"
                  rows={1}
                  style={{ minHeight: '52px', maxHeight: '200px' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(currentMessage);
                    }
                  }}
                  onInput={e => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height =
                      Math.min(target.scrollHeight, 200) + 'px';
                  }}
                  disabled={isTyping}
                />
                <button
                  onClick={() => sendMessage(currentMessage)}
                  disabled={isTyping || !currentMessage.trim()}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 transform items-center justify-center rounded-lg bg-gradient-to-r from-[#2d4a3e] to-[#1a3329] text-white transition-colors hover:from-[#1a3329] hover:to-[#0f1f17] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>

              {/* Tools/Features Row */}
              <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-[#2d4a3e]"></div>
                    <span>JobsGPT can help find jobs in the 209 area</span>
                  </div>
                </div>
                <div className="text-xs">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Follow-up Questions */}
        {hasSearched && followUpQuestions.length > 0 && (
          <div className="mt-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e]">
                  <span className="text-xs font-bold text-[#9fdf9f]">AI</span>
                </div>
                Try asking:
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {followUpQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleFollowUpQuestion(question)}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-left text-sm text-gray-700 transition-colors hover:border-[#2d4a3e] hover:bg-[#9fdf9f]/10 hover:text-[#2d4a3e]"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Advanced Filters (Collapsible) */}
        {hasSearched && (
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex w-full items-center justify-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Advanced Filters
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </Button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white p-6"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Job Type */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Job Type
                      </label>
                      <select
                        value={filters.jobType}
                        onChange={e => {
                          const newFilters = {
                            ...filters,
                            jobType: e.target.value,
                          };
                          setFilters(newFilters);
                          setHasSearched(true);
                          updateURL(newFilters);
                          performSearch(newFilters);
                        }}
                        className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-[#2d4a3e]"
                      >
                        {jobTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Experience Level */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Experience Level
                      </label>
                      <select
                        value={filters.experienceLevel}
                        onChange={e => {
                          const newFilters = {
                            ...filters,
                            experienceLevel: e.target.value,
                          };
                          setFilters(newFilters);
                          setHasSearched(true);
                          updateURL(newFilters);
                          performSearch(newFilters);
                        }}
                        className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-[#2d4a3e]"
                      >
                        {experienceLevels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date Posted */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Date Posted
                      </label>
                      <select
                        value={filters.datePosted}
                        onChange={e => {
                          const newFilters = {
                            ...filters,
                            datePosted: e.target.value,
                          };
                          setFilters(newFilters);
                          setHasSearched(true);
                          updateURL(newFilters);
                          performSearch(newFilters);
                        }}
                        className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-[#2d4a3e]"
                      >
                        {datePostedOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>


                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Job Results Section */}
        {hasSearched && jobs.length > 0 && (
          <div className="mt-8">
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e]">
                    <span className="text-sm font-bold text-[#9fdf9f]">AI</span>
                  </div>
                  <div>
                    <h2 className="mb-2 text-xl font-semibold text-gray-900">
                      All Job Results ({totalResults.toLocaleString()})
                    </h2>
                    <p className="text-sm text-gray-600">
                      Browse all opportunities found by JobsGPT, sorted by
                      relevance
                    </p>
                  </div>
                </div>

                {/* Results Summary */}
                <div className="text-right text-sm text-gray-500">
                  <div>
                    Page {currentPage} of {totalPages}
                  </div>
                  <div>{totalResults.toLocaleString()} total jobs</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <AnimatePresence>
                {jobs.map((job, index) => (
                  <EnhancedJobCard
                    key={
                      job.id ||
                      `job-${index}-${job.title?.slice(0, 10) || 'unknown'}`
                    }
                    id={job.id || `temp-${index}-${Date.now()}`}
                    title={job.title || job.job_title || 'Untitled Position'}
                    company={
                      job.company || job.company_name || 'Unknown Company'
                    }
                    location={
                      job.location ||
                      job.job_location ||
                      'Location not specified'
                    }
                    type={job.type || job.job_type || 'Full-time'}
                    salary={job.salary || job.salary_range}
                    postedAt={
                      job.postedAt ||
                      job.posted_date ||
                      job.created_at ||
                      new Date().toISOString()
                    }
                    description={
                      job.description ||
                      job.job_description ||
                      'No description available'
                    }
                    applyUrl={(() => {
                      const url = job.applyUrl || job.apply_url || job.url;
                      if (url && url !== '#' && url !== '') {
                        return url;
                      }
                      // Only use job detail page if we have a valid job ID
                      if (
                        job.id &&
                        job.id !== 'undefined' &&
                        job.id.trim() !== ''
                      ) {
                        return `/jobs/${job.id}`;
                      }
                      return '#';
                    })()}
                    isFeatured={job.featured || job.is_featured || false}
                    isRemote={job.remote || job.is_remote || false}
                    experienceLevel={
                      job.experienceLevel || job.experience_level
                    }
                    saved={job.saved || false}
                    onSave={() => {
                      console.log('Save job:', job.id);
                    }}
                    onViewDetails={() => {
                      if (job.id) {
                        router.push(`/jobs/${job.id}`);
                      }
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12">
                <JobPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#2d4a3e]"></div>
            <p className="text-gray-600">Searching for jobs...</p>
          </div>
        )}

        {/* Error State */}
        {error && hasSearched && (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="mb-4 text-red-700">{error}</p>
            <Button
              onClick={() => performSearch(filters, currentPage)}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* No Results State */}
        {hasSearched && !loading && jobs.length === 0 && !error && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              No jobs found
            </h3>
            <p className="mb-4 text-gray-600">
              Try adjusting your search terms or filters to find more
              opportunities.
            </p>
            <Button onClick={handleNewSearch} variant="outline">
              Start New Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Simplified Job Search Component (Phase 1)
function SimpleJobSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || searchParams.get('query') || ''
  );
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      // Simple job search without AI
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '20',
        useRelevanceScoring: 'true',
        includeSnippets: 'true',
      });

      const response = await fetch(`/api/jobs/search?${params}`);
      const data = await response.json();

      if (response.ok) {
        const searchResults = data.data?.data || [];
        const jobItems = searchResults.map((result: any) => result.item || result);
        setJobs(jobItems);
        
        // Update URL
        router.replace(`/jobs?q=${encodeURIComponent(searchQuery)}`);
      } else {
        setError(data.error || 'Search failed');
        setJobs([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search for jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (suggestion: string) => {
    setSearchQuery(suggestion);
    // Trigger search automatically
    setTimeout(() => {
      const form = document.querySelector('#search-form') as HTMLFormElement;
      if (form) form.requestSubmit();
    }, 100);
  };

  // Auto-search when coming from homepage
  useEffect(() => {
    const query = searchParams.get('q') || searchParams.get('query');
    if (query && !hasSearched) {
      setSearchQuery(query);
      // Auto-trigger search
      setTimeout(() => {
        const form = document.querySelector('#search-form') as HTMLFormElement;
        if (form) form.requestSubmit();
      }, 500);
    }
  }, [searchParams, hasSearched]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
              Find Jobs in the 209
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
              Search for opportunities in Stockton, Modesto, Tracy, and the Central Valley.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Search Form */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form id="search-form" onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="What kind of work are you looking for?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 text-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-600 py-3 text-lg font-semibold text-white hover:bg-orange-700 disabled:bg-gray-400"
            >
              {loading ? 'Searching...' : 'Search Jobs'}
            </button>
          </form>

          {/* Quick Search Suggestions */}
          {!hasSearched && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-gray-700">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Warehouse jobs in Stockton',
                  'Nursing jobs near Tracy',
                  'Customer service positions',
                  'Manufacturing jobs Modesto'
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleQuickSearch(suggestion)}
                    className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-700 hover:border-orange-300 hover:bg-orange-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-orange-600"></div>
            <p className="text-gray-600">Searching for jobs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="mb-4 text-red-700">{error}</p>
            <button
              onClick={(e) => {
                e.preventDefault();
                const form = document.querySelector('#search-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-red-700 hover:bg-red-50"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Job Results */}
        {hasSearched && !loading && jobs.length > 0 && (
          <div className="space-y-4">
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Found {jobs.length} jobs for "{searchQuery}"
              </h2>
            </div>
            
            {jobs.map((job, index) => (
              <div
                key={job.id || `job-${index}`}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      {job.title || job.job_title || 'Untitled Position'}
                    </h3>
                    <div className="mb-3 flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium">
                        {job.company || job.company_name || 'Unknown Company'}
                      </span>
                      <span>•</span>
                      <span>{job.location || job.job_location || 'Location not specified'}</span>
                      {job.type || job.job_type && (
                        <>
                          <span>•</span>
                          <span className="capitalize">
                            {(job.type || job.job_type).replace('_', ' ')}
                          </span>
                        </>
                      )}
                    </div>
                    {job.description && (
                      <p className="mb-4 text-gray-700 line-clamp-3">
                        {job.description.length > 200 
                          ? job.description.substring(0, 200) + '...'
                          : job.description
                        }
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={() => {
                        if (job.id) {
                          window.open(`/jobs/${job.id}`, '_blank');
                        }
                      }}
                      className="rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {hasSearched && !loading && jobs.length === 0 && !error && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No jobs found</h3>
            <p className="mb-4 text-gray-600">
              Try different keywords or check back later for new opportunities.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setJobs([]);
                setHasSearched(false);
                setError('');
                router.replace('/jobs');
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Start New Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Main export component with Suspense boundary
export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#2d4a3e]"></div>
            <p className="text-gray-600">Loading job search...</p>
          </div>
        </div>
      }
    >
      <JobsContent />
    </Suspense>
  );
}
