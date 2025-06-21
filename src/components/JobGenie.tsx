import React, { useState, useRef, useEffect } from '@/components/ui/card';
import { motion, AnimatePresence } from '@/components/ui/card';
import { ChatBubbleLeftRightIcon as ChatSolidIcon } from '@/components/ui/card';
import { JobGenieProps } from '@/lib/types/component-props';

'use client';

  import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface JobGenieResponse {
  reply: string;
  jobTitle: string;
  company: string;
  contextLoaded: {
    hasCompanyInfo: boolean;
    hasKnowledgeBase: boolean;
    knowledgeCategories: string[];
  };
}

interface AsyncOperationState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  errorType: 'error' | 'network' | 'timeout' | 'validation';
  canRetry: boolean;
  attemptCount: number;
  maxRetries: number;
  lastAttemptTime: number | null;
}

const createAsyncState = (): AsyncOperationState => ({
  isLoading: false,
  hasError: false,
  errorMessage: null,
  errorType: 'error',
  canRetry: true,
  attemptCount: 0,
  maxRetries: 3,
  lastAttemptTime: null,
});

const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
};

export default function JobGenie({
  jobId,
  jobTitle,
  company,
  className = '',
}: JobGenieProps) {
  // Validate required props
  if (!jobId || typeof jobId !== 'string' || jobId.trim().length === 0) {
    console.error('JobGenie: jobId is required and must be a non-empty string');
    return null;
  }

  if (
    !jobTitle ||
    typeof jobTitle !== 'string' ||
    jobTitle.trim().length === 0
  ) {
    console.error(
      'JobGenie: jobTitle is required and must be a non-empty string'
    );
    return null;
  }

  if (!company || typeof company !== 'string' || company.trim().length === 0) {
    console.error(
      'JobGenie: company is required and must be a non-empty string'
    );
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [apiState, setApiState] =
    useState<AsyncOperationState>(createAsyncState());
  const [contextInfo, setContextInfo] = useState<
    JobGenieResponse['contextLoaded'] | null
  >(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  // Focus input when chat opens with cleanup
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Initialize with welcome message only once
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `👋 Hi! I'm JobGenie, your AI assistant for this ${jobTitle} position at ${company}. I can help answer questions about the job requirements, company culture, benefits, and more. What would you like to know?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, jobTitle, company]); // Removed messages.length dependency to prevent re-initialization

  const sendMessage = async (content: string, isRetry: boolean = false) => {
    if (!content.trim() || apiState.isLoading) return;

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    // Only add user message if not retrying
    if (!isRetry) {
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
    }

    // Update API state
    setApiState(prev => ({
      ...prev,
      isLoading: true,
      hasError: false,
      errorMessage: null,
      attemptCount: isRetry ? prev.attemptCount + 1 : 1,
      lastAttemptTime: Date.now(),
    }));

    try {
      const messagesForAPI = (
        isRetry ? messages : messages.concat(userMessage)
      ).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await withTimeout(
        fetch('/api/jobbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId,
            messages: messagesForAPI,
          }),
          signal: controller.signal,
        }),
        30000, // 30 second timeout
        'Request timed out. Please try again.'
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `Server error (${response.status})`;

        throw new Error(errorMessage);
      }

      const data: JobGenieResponse = await response.json();

      // Validate response structure
      if (!data.reply) {
        throw new Error('Invalid response from server');
      }

      // Store context info on first successful response
      if (!contextInfo && data.contextLoaded) {
        setContextInfo(data.contextLoaded);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Reset API state on success
      setApiState(createAsyncState());
    } catch (error) {
      console.error('JobGenie error:', error);

      // Handle different error types
      let errorType: AsyncOperationState['errorType'] = 'error';
      let errorMessage = 'Something went wrong. Please try again.';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // Request was aborted, don't show error
          setApiState(createAsyncState());
          return;
        }

        if (
          error.message.includes('timed out') ||
          error.message.includes('timeout')
        ) {
          errorType = 'timeout';
          errorMessage =
            'Request timed out. Please check your connection and try again.';
        } else if (
          error.message.includes('fetch') ||
          error.message.includes('network')
        ) {
          errorType = 'network';
          errorMessage =
            'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      setApiState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
        errorMessage,
        errorType,
        canRetry: prev.attemptCount < prev.maxRetries,
      }));

      // Add error message to chat for user feedback
      const errorChatMessage: Message = {
        role: 'assistant',
        content: `😅 Sorry, I encountered an issue: ${errorMessage}${apiState.attemptCount < apiState.maxRetries ? ' You can try again or use the retry button.' : ''}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorChatMessage]);
    }
  };

  const retryLastMessage = async () => {
    if (!apiState.canRetry || apiState.isLoading) return;

    // Find the last user message to retry
    const lastUserMessage = [...messages]
      .reverse()
      .find(msg => msg.role === 'user');
    if (lastUserMessage) {
      await sendMessage(lastUserMessage.content, true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const formatTime = (date: Date) => {
    try {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const quickQuestions = [
    'What are the main requirements for this role?',
    'Tell me about the company culture',
    'What benefits does this position offer?',
    'Is remote work available?',
    "What's the interview process like?",
  ];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 rounded-full bg-[#ff6b35] p-4 text-white shadow-lg transition-colors hover:bg-[#e55a2b] ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open JobGenie chat"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <div className="relative">
            <ChatBubbleLeftRightIcon className="h-6 w-6" />
            <SparklesIcon className="absolute -right-1 -top-1 h-3 w-3 text-yellow-300" />
          </div>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="rounded-full bg-white/20 p-1">
                    <SparklesIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">JobGenie</h3>
                    <p className="text-xs opacity-90">Ask me about this job</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/70 transition-colors hover:text-white"
                  aria-label="Close chat"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Context Indicator */}
              {contextInfo && (
                <div className="mt-2 text-xs">
                  <div className="flex items-center space-x-2 text-white/80">
                    <div className="h-2 w-2 rounded-full bg-green-400"></div>
                    <span>
                      Connected •{' '}
                      {contextInfo.hasCompanyInfo
                        ? 'Company info loaded'
                        : 'Basic info loaded'}
                      {contextInfo.hasKnowledgeBase &&
                        ` • ${contextInfo.knowledgeCategories.length} knowledge categories`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div
              className="h-96 space-y-4 overflow-y-auto p-4"
              role="log"
              aria-live="polite"
              aria-label="Chat conversation with JobGenie"
            >
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  role="article"
                  aria-label={`${message.role === 'user' ? 'Your message' : 'JobGenie response'} at ${formatTime(message.timestamp)}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        message.role === 'user'
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      <span className="sr-only">Sent at </span>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {apiState.isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="rounded-lg bg-gray-100 p-3">
                    <LoadingSpinner
                      size="sm"
                      variant="dots"
                      color="gray"
                      message="Thinking..."
                    />
                  </div>
                </motion.div>
              )}

              {/* Quick Questions (show when no messages yet) */}
              {messages.length === 1 && !apiState.isLoading && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">
                    Quick questions:
                  </p>
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(question)}
                      disabled={apiState.isLoading}
                      className="block w-full rounded border bg-gray-50 p-2 text-left text-xs transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            {apiState.hasError && (
              <div className="border-t border-gray-200 px-4 py-2">
                <ErrorDisplay
                  error={apiState.errorMessage}
                  type={apiState.errorType}
                  size="sm"
                  variant="inline"
                  canRetry={apiState.canRetry}
                  onRetry={retryLastMessage}
                  maxRetries={apiState.maxRetries}
                  currentAttempt={apiState.attemptCount}
                  retryLabel="Retry Message"
                  showIcon={false}
                />
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <label htmlFor="jobgenie-input" className="sr-only">
                  Ask JobGenie about this job
                </label>
                <input
                  id="jobgenie-input"
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about this job..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={apiState.isLoading}
                  maxLength={500}
                  aria-describedby="character-count"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || apiState.isLoading}
                  className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  aria-label="Send message"
                >
                  {apiState.isLoading ? (
                    <LoadingSpinner size="sm" variant="spinner" color="white" />
                  ) : (
                    <PaperAirplaneIcon className="h-4 w-4" />
                  )}
                </button>
              </form>

              {/* Character count */}
              <div
                id="character-count"
                className="mt-1 text-right text-xs text-gray-400"
                aria-live="polite"
              >
                <span className="sr-only">Character count: </span>
                {inputValue.length} of 500 characters used
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
