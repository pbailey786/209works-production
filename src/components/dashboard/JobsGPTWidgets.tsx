'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Clock,
  Search,
  Bookmark,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { WidgetCard } from './DashboardCards';
import { Button } from '@/components/ui/button';

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

interface SavedSearch {
  id: string;
  query: string;
  filters: any;
  resultCount: number;
  lastRun: string;
}

interface JobsGPTStats {
  totalChats: number;
  totalQuestions: number;
  jobsFound: number;
  applicationsHelped: number;
}

export function RecentChatsWidget() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const response = await fetch('/api/chat-history');
        if (response.ok) {
          const data = await response.json();
          setChats(data.conversations?.slice(0, 3) || []);
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
        // Mock data for demo
        setChats([
          {
            id: '1',
            title: 'Software Engineering Jobs',
            lastMessage: 'Found 5 software engineering positions in Stockton...',
            timestamp: '2 hours ago',
            messageCount: 8,
          },
          {
            id: '2',
            title: 'Healthcare Opportunities',
            lastMessage: 'Here are some nursing positions in Modesto...',
            timestamp: '1 day ago',
            messageCount: 12,
          },
          {
            id: '3',
            title: 'Remote Work Options',
            lastMessage: 'I found several remote-friendly companies...',
            timestamp: '3 days ago',
            messageCount: 6,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentChats();
  }, []);

  return (
    <WidgetCard
      title="Recent JobsGPT Chats"
      subtitle="Continue your job search conversations"
      icon={<MessageSquare className="h-5 w-5" />}
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">No recent chats</p>
            <Button
              onClick={() => router.push('/chat')}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600"
            >
              Start Chatting with Rust
            </Button>
          </div>
        ) : (
          <>
            {chats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => router.push(`/chat?conversation=${chat.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {chat.title}
                    </h4>
                    <p className="text-xs text-gray-600 truncate mt-1">
                      {chat.lastMessage}
                    </p>
                    <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{chat.timestamp}</span>
                      <span>•</span>
                      <span>{chat.messageCount} messages</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              </motion.div>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <Button
                onClick={() => router.push('/chat')}
                variant="ghost"
                size="sm"
                className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                View All Chats
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </WidgetCard>
  );
}

export function SavedSearchesWidget() {
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSavedSearches = async () => {
      try {
        // Mock data for now - implement API later
        setSearches([
          {
            id: '1',
            query: 'software engineer remote',
            filters: { location: '209 area', jobType: 'full_time' },
            resultCount: 12,
            lastRun: '1 hour ago',
          },
          {
            id: '2',
            query: 'healthcare jobs modesto',
            filters: { location: 'Modesto', industry: 'healthcare' },
            resultCount: 8,
            lastRun: '6 hours ago',
          },
          {
            id: '3',
            query: 'warehouse logistics',
            filters: { location: 'Stockton', industry: 'logistics' },
            resultCount: 15,
            lastRun: '1 day ago',
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch saved searches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedSearches();
  }, []);

  return (
    <WidgetCard
      title="Saved JobsGPT Searches"
      subtitle="Quick access to your frequent searches"
      icon={<Bookmark className="h-5 w-5" />}
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : searches.length === 0 ? (
          <div className="text-center py-6">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">No saved searches</p>
            <Button
              onClick={() => router.push('/chat')}
              size="sm"
              variant="outline"
            >
              Start Searching
            </Button>
          </div>
        ) : (
          <>
            {searches.map((search) => (
              <motion.div
                key={search.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => router.push(`/chat?search=${encodeURIComponent(search.query)}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      "{search.query}"
                    </h4>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-600">
                      <span>{search.resultCount} results</span>
                      <span>•</span>
                      <span>Last run {search.lastRun}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              </motion.div>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <Button
                onClick={() => router.push('/chat')}
                variant="ghost"
                size="sm"
                className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                Create New Search
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </WidgetCard>
  );
}

export function JobsGPTStatsWidget() {
  const [stats, setStats] = useState<JobsGPTStats>({
    totalChats: 0,
    totalQuestions: 0,
    jobsFound: 0,
    applicationsHelped: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Mock data for now - implement API later
        setStats({
          totalChats: 12,
          totalQuestions: 47,
          jobsFound: 156,
          applicationsHelped: 8,
        });
      } catch (error) {
        console.error('Failed to fetch JobsGPT stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <WidgetCard
      title="Your JobsGPT Journey"
      subtitle="Track your AI-powered job search progress"
      icon={<TrendingUp className="h-5 w-5" />}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.totalChats}</div>
          <div className="text-xs text-gray-600">Conversations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</div>
          <div className="text-xs text-gray-600">Questions Asked</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.jobsFound}</div>
          <div className="text-xs text-gray-600">Jobs Discovered</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.applicationsHelped}</div>
          <div className="text-xs text-gray-600">Applications Assisted</div>
        </div>
      </div>
    </WidgetCard>
  );
}
