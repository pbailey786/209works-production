'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MapPin, Calendar, DollarSign, Briefcase, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import AdDisplay from '../../components/ads/AdDisplay';
import JobPagination from '../../components/job-search/JobPagination';

import EnhancedJobCard from '../../components/job-search/EnhancedJobCard';

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
  { value: 'temporary', label: 'Temporary' },
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
  const [conversation, setConversation] = useState<Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    jobs?: any[];
    metadata?: any;
  }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Legacy AI response state (for backward compatibility)
  const [aiResponse, setAiResponse] = useState<string>('');
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Placeholder rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % suggestions.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);



  // Hybrid LLM + fallback search function
  const performSearch = useCallback(async (searchFilters: SearchFilters, page: number = 1) => {
    setLoading(true);
    setError('');
    setAiResponse('');
    setFollowUpQuestions([]);

    try {
      // First, try the LLM job search endpoint for natural language processing
      const requestBody = {
        userMessage: searchFilters.query,
        conversationHistory: [], // Could be enhanced to maintain conversation context
        filters: {
          location: searchFilters.location,
          jobType: searchFilters.jobType,
          experienceLevel: searchFilters.experienceLevel,
          salaryMin: searchFilters.salaryMin ? parseInt(searchFilters.salaryMin) : undefined,
          salaryMax: searchFilters.salaryMax ? parseInt(searchFilters.salaryMax) : undefined,
          remote: searchFilters.remote,
          datePosted: searchFilters.datePosted,
        }
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
        if (llmData.followUpQuestions && llmData.followUpQuestions.length > 0) {
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

        if (searchFilters.location) params.set('location', searchFilters.location);
        if (searchFilters.jobType) params.set('jobType', searchFilters.jobType);
        if (searchFilters.experienceLevel) params.set('experienceLevel', searchFilters.experienceLevel);
        if (searchFilters.salaryMin) params.set('salaryMin', searchFilters.salaryMin);
        if (searchFilters.salaryMax) params.set('salaryMax', searchFilters.salaryMax);
        if (searchFilters.remote) params.set('remote', 'true');
        if (searchFilters.datePosted) params.set('datePosted', searchFilters.datePosted);

        const fallbackRes = await fetch(`/api/jobs/search?${params}`);
        const fallbackData = await fallbackRes.json();

        console.log('Fallback Search Response:', fallbackData);

        if (fallbackRes.ok) {
          // Handle the nested response structure: data.data[].item
          const searchResults = fallbackData.data?.data || [];
          const jobItems = searchResults.map((result: any) => result.item || result);
          setJobs(jobItems);

          // Set a basic AI-style response for the fallback
          setAiResponse(`I found ${jobItems.length} jobs matching "${searchFilters.query}" using enhanced search. While our AI analysis is temporarily unavailable, these results are ranked by relevance to help you find the best opportunities in the 209 area.`);

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
  }, []);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: SearchFilters, page: number = 1) => {
    const params = new URLSearchParams();

    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.location) params.set('location', newFilters.location);
    if (newFilters.jobType) params.set('jobType', newFilters.jobType);
    if (newFilters.experienceLevel) params.set('experienceLevel', newFilters.experienceLevel);
    if (newFilters.salaryMin) params.set('salaryMin', newFilters.salaryMin);
    if (newFilters.salaryMax) params.set('salaryMax', newFilters.salaryMax);
    if (newFilters.remote) params.set('remote', 'true');
    if (newFilters.datePosted) params.set('datePosted', newFilters.datePosted);
    if (newFilters.sortBy !== 'relevance') params.set('sortBy', newFilters.sortBy);
    if (page > 1) params.set('page', page.toString());

    const url = `/jobs${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(url, { scroll: false });
  }, [router]);

  // Chat-style message handling
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

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
          sessionId: 'user-session'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add assistant response to conversation
        const assistantMessage = {
          id: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'assistant' as const,
          content: data.response,
          timestamp: new Date(),
          jobs: data.jobs || [],
          metadata: data.metadata
        };

        setConversation(prev => [...prev, assistantMessage]);
        setJobs(data.jobs || []);
        setTotalResults(data.jobs?.length || 0);
        setFollowUpQuestions(data.followUpQuestions || []);

        // Update URL for sharing
        const newFilters = { ...filters, query: message.trim() };
        setFilters(newFilters);
        updateURL(newFilters, 1);
      } else {
        throw new Error(data.error || 'Failed to search');
      }
    } catch (error) {
      console.error('Chat search error:', error);
      const errorMessage = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'assistant' as const,
        content: 'Sorry, I encountered an error while searching for jobs. Please try again.',
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [conversation, filters, updateURL]);

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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-[#2563EB] to-[#2d4a3e] rounded-full">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#2563EB] to-[#2d4a3e] bg-clip-text text-transparent">
                  JobsGPT for 209
                </h1>
                <p className="text-gray-600 text-sm">
                  AI-powered job search for the 209 area
                </p>
              </div>
            </div>

            {hasSearched && (
              <Button
                variant="outline"
                onClick={handleNewSearch}
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                New Search
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Chat Interface - Full Width */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
          {/* Chat Header - Simplified */}
          {conversation.length === 0 && (
            <div className="text-center py-12 px-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#2563EB] to-[#2d4a3e] rounded-full mx-auto mb-6">
                <span className="text-white text-xl font-bold">AI</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                What's on your mind today?
              </h2>
              <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                Ask me about jobs in the 209 area. I can help you find opportunities in Stockton, Modesto, Tracy, Manteca, and surrounding Central Valley cities.
              </p>

              {/* Suggestion Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {[
                  "Show me warehouse jobs in Stockton",
                  "Find nursing jobs near Tracy",
                  "What customer service jobs are available?",
                  "Remote tech jobs in the 209 area"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(suggestion)}
                    className="text-left p-4 bg-gray-50 hover:bg-[#2563EB]/5 border border-gray-200 hover:border-[#2563EB] rounded-xl transition-all duration-200 text-gray-700 hover:text-[#2563EB]"
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
              <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
                {conversation.map((message) => (
                  <div key={message.id} className="space-y-6">
                    {/* User Message - Right Side with Shadow */}
                    {message.type === 'user' && (
                      <div className="flex items-start gap-4 justify-end">
                        <div className="flex-1 max-w-3xl">
                          <div className="bg-gray-100 rounded-2xl px-4 py-3 shadow-sm border border-gray-200 ml-auto max-w-fit">
                            <p className="text-gray-900 text-base leading-relaxed">{message.content}</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">U</span>
                        </div>
                      </div>
                    )}

                    {/* Assistant Message - Left Side */}
                    {message.type === 'assistant' && (
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-[#2563EB] to-[#2d4a3e] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">AI</span>
                        </div>
                        <div className="flex-1 max-w-4xl">
                          <div className="prose prose-gray max-w-none">
                            <p className="text-gray-900 text-base leading-relaxed mb-4">{message.content}</p>

                            {/* Show first few jobs in chat - Enhanced with clickable cards */}
                            {message.jobs && message.jobs.length > 0 && (
                              <div className="bg-gray-50 rounded-xl p-4 mt-4 border border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                                  </svg>
                                  Top {Math.min(3, message.jobs.length)} Results:
                                </h4>
                                <div className="space-y-3">
                                  {message.jobs.slice(0, 3).map((job, index) => (
                                    <div
                                      key={`chat-job-${job.id || `${index}-${Date.now()}`}`}
                                      onClick={() => {
                                        console.log('Job clicked:', job);
                                        if (job.id) {
                                          window.open(`/jobs/${job.id}`, '_blank');
                                        } else {
                                          console.warn('Job ID is missing:', job);
                                        }
                                      }}
                                      className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md hover:border-[#2563EB] transition-all duration-200 cursor-pointer group"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h5 className="font-semibold text-gray-900 group-hover:text-[#2563EB] transition-colors mb-1">
                                            {job.title}
                                          </h5>
                                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                            <span className="font-medium">{job.company}</span>
                                            <span>•</span>
                                            <span>{job.location}</span>
                                            {job.jobType && (
                                              <>
                                                <span>•</span>
                                                <span className="capitalize">{job.jobType.replace('_', ' ')}</span>
                                              </>
                                            )}
                                          </div>
                                          {job.salaryMin && job.salaryMax && (
                                            <div className="flex items-center gap-1 mb-2">
                                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                              </svg>
                                              <span className="text-sm text-green-600 font-semibold">
                                                ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
                                              </span>
                                            </div>
                                          )}
                                          {job.description && (
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                              {job.description.length > 120
                                                ? job.description.substring(0, 120) + '...'
                                                : job.description
                                              }
                                            </p>
                                          )}
                                        </div>
                                        <div className="ml-3 flex-shrink-0">
                                          <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {message.jobs.length > 3 && (
                                  <div className="mt-4 pt-3 border-t border-gray-200">
                                    <p className="text-sm text-gray-600 text-center">
                                      <span className="font-medium">+ {message.jobs.length - 3} more jobs</span> shown below
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
                    <div className="w-8 h-8 bg-gradient-to-r from-[#2563EB] to-[#2d4a3e] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    <div className="flex-1 max-w-4xl">
                      <div className="bg-gray-100 rounded-2xl px-4 py-3 inline-block border border-gray-200">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
            <div className="max-w-5xl mx-auto">
              <div className="relative">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Ask anything about jobs in the 209 area..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-lg leading-relaxed"
                  rows={1}
                  style={{ minHeight: '52px', maxHeight: '200px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(currentMessage);
                    }
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                  }}
                  disabled={isTyping}
                />
                <button
                  onClick={() => sendMessage(currentMessage)}
                  disabled={isTyping || !currentMessage.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-[#2563EB] to-[#2d4a3e] hover:from-[#1d4ed8] hover:to-[#1f3a2e] disabled:bg-gray-300 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>

              {/* Tools/Features Row */}
              <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] rounded-full">
                  <span className="text-[#9fdf9f] text-xs font-bold">AI</span>
                </div>
                Try asking:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {followUpQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleFollowUpQuestion(question)}
                    className="text-left p-3 bg-gray-50 hover:bg-[#9fdf9f]/10 border border-gray-200 hover:border-[#2d4a3e] rounded-lg transition-colors text-sm text-gray-700 hover:text-[#2d4a3e]"
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
              className="w-full flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Advanced Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 bg-white rounded-xl border border-gray-200 p-6 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Job Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Job Type
                          </label>
                          <select
                            value={filters.jobType}
                            onChange={(e) => {
                              const newFilters = { ...filters, jobType: e.target.value };
                              setFilters(newFilters);
                              setHasSearched(true);
                              updateURL(newFilters);
                              performSearch(newFilters);
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {jobTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Experience Level */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Experience Level
                          </label>
                          <select
                            value={filters.experienceLevel}
                            onChange={(e) => {
                              const newFilters = { ...filters, experienceLevel: e.target.value };
                              setFilters(newFilters);
                              setHasSearched(true);
                              updateURL(newFilters);
                              performSearch(newFilters);
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {experienceLevels.map((level) => (
                              <option key={level.value} value={level.value}>
                                {level.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Date Posted */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Posted
                          </label>
                          <select
                            value={filters.datePosted}
                            onChange={(e) => {
                              const newFilters = { ...filters, datePosted: e.target.value };
                              setFilters(newFilters);
                              setHasSearched(true);
                              updateURL(newFilters);
                              performSearch(newFilters);
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {datePostedOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Remote Work */}
                        <div className="flex items-center">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.remote}
                              onChange={(e) => {
                                const newFilters = { ...filters, remote: e.target.checked };
                                setFilters(newFilters);
                                setHasSearched(true);
                                updateURL(newFilters);
                                performSearch(newFilters);
                              }}
                              className="mr-3 h-4 w-4 text-[#2563EB] focus:ring-[#2563EB] border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Remote Work Only
                            </span>
                          </label>
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
            <div className="mb-6 bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] rounded-full flex-shrink-0 mt-1">
                    <span className="text-[#9fdf9f] text-sm font-bold">AI</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      All Job Results ({totalResults.toLocaleString()})
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Browse all opportunities found by JobsGPT, sorted by relevance
                    </p>
                  </div>
                </div>

                {/* Results Summary */}
                <div className="text-right text-sm text-gray-500">
                  <div>Page {currentPage} of {totalPages}</div>
                  <div>{totalResults.toLocaleString()} total jobs</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <AnimatePresence>
                {jobs.map((job, index) => (
                  <EnhancedJobCard
                    key={job.id || `job-${index}-${job.title?.slice(0, 10) || 'unknown'}`}
                    id={job.id || `temp-${index}-${Date.now()}`}
                    title={job.title || job.job_title || 'Untitled Position'}
                    company={job.company || job.company_name || 'Unknown Company'}
                    location={job.location || job.job_location || 'Location not specified'}
                    type={job.type || job.job_type || 'Full-time'}
                    salary={job.salary || job.salary_range}
                    postedAt={job.postedAt || job.posted_date || job.created_at || new Date().toISOString()}
                    description={job.description || job.job_description || 'No description available'}
                    applyUrl={(() => {
                      const url = job.applyUrl || job.apply_url || job.url;
                      if (url && url !== '#' && url !== '') {
                        return url;
                      }
                      // Only use job detail page if we have a valid job ID
                      if (job.id && job.id !== 'undefined' && job.id.trim() !== '') {
                        return `/jobs/${job.id}`;
                      }
                      return '#';
                    })()}
                    isFeatured={job.featured || job.is_featured || false}
                    isRemote={job.remote || job.is_remote || false}
                    experienceLevel={job.experienceLevel || job.experience_level}
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for jobs...</p>
          </div>
        )}

        {/* Error State */}
        {error && hasSearched && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 mb-4">{error}</p>
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
          <div className="mt-8 bg-white rounded-xl p-8 text-center border border-gray-200">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters to find more opportunities.
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

// Main export component with Suspense boundary
export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job search...</p>
        </div>
      </div>
    }>
      <JobsContent />
    </Suspense>
  );
}
