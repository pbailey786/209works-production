'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  PaperAirplaneIcon,
  MicrophoneIcon,
  StopIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
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

export default function HomepageChat() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
          content: `Hi there! I'm your AI job search assistant for the 209 area.

Try asking me something like "Find warehouse jobs in Stockton" or "Show me local healthcare jobs".`,
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

  // Job card action handlers
  const handleApplyToJob = async (jobId: string) => {
    window.open(`/jobs/${jobId}`, '_blank');
  };

  const handleViewJobDetails = async (jobId: string) => {
    window.open(`/jobs/${jobId}`, '_blank');
  };

  const handleSaveJob = async (jobId: string) => {
    // For homepage, just open the job page
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

  const suggestedPrompts = [
    "Find warehouse jobs in Stockton",
    "Show me healthcare jobs in Modesto", 
    "Local customer service jobs",
    "What jobs pay well in Tracy?",
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Messages Area */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 border border-gray-100 text-gray-900'
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
                    <div className="text-sm">
                      {message.content.split('\n').map((line, index) => (
                        <p key={index} className={message.role === 'user' ? 'text-white' : 'text-gray-900'}>
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Job Cards */}
            {messages
              .filter(message => message.role === 'assistant' && message.jobs && message.jobs.length > 0)
              .slice(-1) // Only show jobs from the latest response
              .map((message, messageIndex) => (
                <div key={messageIndex} className="mt-4 space-y-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {message.jobs!.length === 1 ? 'Found 1 job:' : `Found ${message.jobs!.length} jobs:`}
                  </div>
                  {message.jobs!.slice(0, 3).map((job: any) => (
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
                  {message.jobs!.length > 3 && (
                    <div className="text-center">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View all {message.jobs!.length} jobs
                      </button>
                    </div>
                  )}
                </div>
              ))}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
        {/* Suggested Prompts (only show when no conversation or just welcome) */}
        {messages.length <= 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(prompt)}
                className="text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
              >
                <div className="flex items-center space-x-2">
                  <SparklesIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-700">{prompt}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Listening... Speak now!" : "Ask me about jobs in the 209 area..."}
              className={`w-full resize-none rounded-lg border px-4 py-3 pr-20 focus:outline-none focus:ring-2 ${
                isListening
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
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
              className="absolute bottom-2 right-2 rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500 text-center">
          JobsGPT may display inaccurate info, so double-check responses.
          {speechSupported && <span> Voice input processes locally on your device.</span>}
        </p>
      </div>
    </div>
  );
}