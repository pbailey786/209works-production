'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  XMarkIcon, 
  PlusIcon, 
  Bars3Icon,
  PaperAirplaneIcon,
  MicrophoneIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import ChatHistory from '@/components/chat/ChatHistory';
import JobCard from '@/components/chat/JobCard';

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  typing?: boolean;
  jobs?: any[];
  metadata?: any;
}

// Import the ChatHistory component's interface to ensure compatibility
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

export default function ChatPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle initial query from URL
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && messages.length === 1) {
      handleSendMessage(query);
    }
  }, [searchParams, messages.length]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          setIsListening(true);
        };
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(prev => prev + transcript);
          setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hey! Tell me what's going on - looking for work? 💼`,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      typing: true,
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await fetch('/api/chat-job-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: content.trim(),
          conversationHistory: messages.map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
          sessionId: currentSessionId,
          userContext: null, // Will be enhanced later with context extraction
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Remove typing indicator and add actual response
      setMessages(prev => {
        const withoutTyping = prev.filter((m: any) => m.id !== 'typing');
        return [
          ...withoutTyping,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.response || 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date(),
            jobs: data.jobs || [],
            metadata: data.metadata || {},
          },
        ];
      });

      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        const withoutTyping = prev.filter((m: any) => m.id !== 'typing');
        return [
          ...withoutTyping,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const startNewChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hey! Tell me what's going on - looking for work? 💼`,
        timestamp: new Date(),
      },
    ]);
    setCurrentSessionId(null);
    setInputValue('');
  };

  const loadConversation = (conversation: ChatConversation) => {
    // Convert ChatMessage[] to Message[]
    const convertedMessages: Message[] = conversation.messages.map((msg, index) => ({
      id: `loaded-${index}-${Date.now()}`,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      typing: false,
      jobs: [],
      metadata: {}
    }));
    
    setMessages(convertedMessages);
    setCurrentSessionId(conversation.sessionId);
    setSidebarOpen(false); // Close sidebar on mobile after loading
  };

  const suggestedPrompts = [
    "Find local warehouse jobs in Stockton",
    "What companies are hiring locally in the 209 area?",
    "Show me in-person healthcare jobs in Modesto",
    "Find local customer service jobs I can drive to",
    "What local jobs pay well in Tracy?",
    "Show me jobs where I don't need to work from home",
  ];

  // Job card action handlers with conversation memory tracking
  const trackJobInteraction = async (jobId: string, action: 'viewed' | 'applied' | 'saved' | 'rejected') => {
    try {
      await fetch('/api/job-interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSessionId || `session_${Date.now()}`,
          jobId,
          action,
        }),
      });
    } catch (error) {
      console.error('Failed to track job interaction:', error);
    }
  };

  const handleApplyToJob = async (jobId: string) => {
    // Track the interaction
    await trackJobInteraction(jobId, 'applied');
    // Open job page in new window
    window.open(`/jobs/${jobId}`, '_blank');
  };

  const handleViewJobDetails = async (jobId: string) => {
    // Track the interaction
    await trackJobInteraction(jobId, 'viewed');
    // Open job page in new window
    window.open(`/jobs/${jobId}`, '_blank');
  };

  const handleSaveJob = async (jobId: string) => {
    // Track the interaction
    await trackJobInteraction(jobId, 'saved');
    // Open job page in new window so they can save it
    window.open(`/jobs/${jobId}`, '_blank');
  };

  // Voice input handlers
  const startListening = () => {
    if (recognitionRef.current && speechSupported && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 lg:relative lg:z-0"
          >
            <div className="flex h-full flex-col">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <SparklesIcon className="h-6 w-6 text-orange-500" />
                  <h1 className="text-lg font-semibold text-gray-900">JobsGPT</h1>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden rounded-md p-1 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* New Chat Button */}
              <div className="p-4">
                <button
                  onClick={startNewChat}
                  className="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>New Chat</span>
                </button>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-hidden">
                <ChatHistory
                  onLoadConversation={loadConversation}
                  className="h-full border-0 rounded-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center space-x-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            )}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center">
                <SparklesIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-900">JobsGPT</h2>
                <p className="text-xs text-gray-500">209 Area Job Search Assistant</p>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {user ? `Signed in as ${user.firstName || user.emailAddresses[0]?.emailAddress}` : 'Not signed in'}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-orange-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {message.typing ? (
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500 ml-2">Thinking...</span>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      {message.content.split('\n').map((line, index) => (
                        <p key={index} className={message.role === 'user' ? 'text-white' : 'text-gray-900'}>
                          {line}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Job Cards */}
                  {message.role === 'assistant' && message.jobs && message.jobs.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        {message.jobs.length === 1 ? 'Found 1 job:' : `Found ${message.jobs.length} jobs:`}
                      </div>
                      {message.jobs.slice(0, 3).map((job: any) => (
                        <JobCard
                          key={job.id}
                          job={{
                            id: job.id,
                            title: job.title,
                            company: job.company,
                            location: job.location,
                            salary: job.salaryMin && job.salaryMax
                              ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                              : job.salaryMin
                              ? `$${job.salaryMin.toLocaleString()}+`
                              : undefined,
                            type: job.jobType || 'Full-time',
                            postedDate: job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'Recently posted',
                            description: job.description,
                            requirements: job.requirements ? [job.requirements] : [],
                            benefits: job.benefits ? [job.benefits] : [],
                            remote: job.isRemote,
                            urgent: false,
                          }}
                          compact={true}
                          onApply={handleApplyToJob}
                          onViewDetails={handleViewJobDetails}
                          onSave={handleSaveJob}
                        />
                      ))}
                      {message.jobs.length > 3 && (
                        <div className="text-center">
                          <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                            View all {message.jobs.length} jobs
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Suggested Prompts (only show when no conversation) */}
            {messages.length === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-left p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <SparklesIcon className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-gray-700">{prompt}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "Listening... Speak now!" : "Ask me anything about jobs in the 209 area..."}
                  className={`w-full resize-none rounded-lg border px-4 py-3 pr-20 focus:outline-none focus:ring-1 ${
                    isListening
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                  }`}
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  disabled={isLoading}
                />

                {/* Voice Input Button */}
                {speechSupported && (
                  <button
                    onClick={toggleListening}
                    disabled={isLoading}
                    className={`absolute bottom-2 right-12 rounded-lg p-2 transition-colors ${
                      isListening
                        ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? (
                      <StopIcon className="h-4 w-4" />
                    ) : (
                      <MicrophoneIcon className="h-4 w-4" />
                    )}
                  </button>
                )}

                {/* Send Button */}
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute bottom-2 right-2 rounded-lg bg-orange-500 p-2 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 text-center">
              JobsGPT may display inaccurate info, so double-check responses.
              {speechSupported && <span> Voice input processes locally on your device.</span>}
              <a href="/privacy" className="text-orange-600 hover:underline ml-1">Your Privacy & Central AI</a>
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}