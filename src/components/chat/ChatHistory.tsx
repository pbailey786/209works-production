'use client';

import { useState, useEffect } from 'react';
// // import { useSession } from 'next-auth/react'; // TODO: Replace with Clerk // TODO: Replace with Clerk
import { formatDistanceToNow } from 'date-fns';
import {
  Clock,
  MessageSquare,
  Trash2,
  ChevronRight,
  User,
  Bot,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatConversation {
  id: string;
  sessionId: string;
  title: string;
  messages: ChatMessage[];
  lastActivity: string;
  createdAt: string;
}

interface ChatHistoryProps {
  onLoadConversation?: (conversation: ChatConversation) => void;
  className?: string;
}

export default function ChatHistory({ onLoadConversation, className = '' }: ChatHistoryProps) {
  // Mock session for now - replace with Clerk when implemented
  const session = { user: { email: 'admin@209.works', role: 'admin' } };
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchChatHistory();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const fetchChatHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chat-history');
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        setError('Failed to load chat history');
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setError('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat-history?id=${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      } else {
        setError('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError('Failed to delete conversation');
    }
  };

  const handleLoadConversation = (conversation: ChatConversation) => {
    if (onLoadConversation) {
      onLoadConversation(conversation);
    }
  };

  const toggleExpanded = (conversationId: string) => {
    setExpandedConversation(prev => 
      prev === conversationId ? null : conversationId
    );
  };

  if (!session?.user) {
    return (
      <div className={`rounded-lg border border-gray-200 bg-white p-6 ${className}`}>
        <div className="text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Sign in to save chat history
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Create an account to save and revisit your job search conversations.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`rounded-lg border border-gray-200 bg-white p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-6 ${className}`}>
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchChatHistory}
          className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-gray-200 bg-white ${className}`}>
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-gray-400" />
          Chat History
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Your recent job search conversations (max 10 saved)
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {conversations.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h4 className="mt-4 text-lg font-medium text-gray-900">
              No conversations yet
            </h4>
            <p className="mt-2 text-sm text-gray-600">
              Start a conversation with JobsGPT to see your chat history here.
            </p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div key={conversation.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => toggleExpanded(conversation.id)}
                    className="flex items-center w-full text-left group"
                  >
                    <ChevronRight 
                      className={`mr-2 h-4 w-4 text-gray-400 transition-transform ${
                        expandedConversation === conversation.id ? 'rotate-90' : ''
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                        {conversation.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conversation.lastActivity), { addSuffix: true })}
                        {' • '}
                        {conversation.messages.length} messages
                      </p>
                    </div>
                  </button>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {onLoadConversation && (
                    <button
                      onClick={() => handleLoadConversation(conversation)}
                      className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                    >
                      Load
                    </button>
                  )}
                  <button
                    onClick={() => deleteConversation(conversation.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedConversation === conversation.id && (
                <div className="mt-3 pl-6 space-y-2 max-h-60 overflow-y-auto">
                  {conversation.messages.slice(-6).map((message, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-900 line-clamp-2">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {conversation.messages.length > 6 && (
                    <p className="text-xs text-gray-500 text-center">
                      ... and {conversation.messages.length - 6} more messages
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
