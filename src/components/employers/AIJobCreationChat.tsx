'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowRight, FileText, MapPin, DollarSign, Clock, CheckCircle, Briefcase } from 'lucide-react';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

interface JobData {
  title?: string;
  company?: string;
  description?: string;
  requirements?: string;
  salary?: string;
  location?: string;
  jobType?: string;
  urgency?: string;
  dealBreakers?: string[];
  priorities?: string[];
  contactMethod?: string;
  schedule?: string;
  benefits?: string;
}

interface AIJobCreationChatProps {
  onJobComplete: (jobData: JobData) => void;
}

export default function AIJobCreationChat({ onJobComplete }: AIJobCreationChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "✨ Hi! I'm your Job Genie! I'll help you create the perfect job post for the Central Valley. What position are you looking to fill?",
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [jobData, setJobData] = useState<JobData>({});
  const [isComplete, setIsComplete] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (role: 'assistant' | 'user', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      // Call AI API to process the conversation and extract job details
      const response = await fetch('/api/employers/ai-job-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          currentJobData: jobData
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();
      
      // Update job data
      if (data.jobData) {
        setJobData(prev => ({ ...prev, ...data.jobData }));
      }

      // Add AI response
      addMessage('assistant', data.response);

      // Check if job creation is complete
      if (data.isComplete) {
        setIsComplete(true);
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      addMessage('assistant', "I'm sorry, I encountered an error. Could you please try again?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBuildJobAd = () => {
    onJobComplete(jobData);
  };

  // Check if we have enough data to show the build button
  const hasEnoughData = jobData.title && jobData.salary && (jobData.description || jobData.requirements);

  return (
    <div className="max-w-7xl mx-auto h-[800px] flex gap-6">
      {/* Main Chat Area - Left Side */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Job Genie 🧞‍♂️</h2>
              <p className="text-sm text-gray-600">Your magical job posting assistant</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {message.role === 'assistant' && (
                    <Bot className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  )}
                  {message.role === 'user' && (
                    <User className="w-5 h-5 text-blue-100 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-5 py-3">
                <div className="flex items-center space-x-3">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Job Preview Panel - Right Side */}
      <div className="w-96 bg-gray-50 rounded-xl shadow-lg p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          Job Details Preview
        </h3>

        {Object.keys(jobData).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">Job details will appear here as you chat with the Job Genie</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title */}
            {jobData.title && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start space-x-2">
                  <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Position</p>
                    <p className="text-lg font-semibold text-gray-900">{jobData.title}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            {jobData.location && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Location</p>
                    <p className="text-base text-gray-900">{jobData.location}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Salary */}
            {jobData.salary && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Salary</p>
                    <p className="text-base text-gray-900">{jobData.salary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Job Type & Schedule */}
            {(jobData.jobType || jobData.schedule) && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start space-x-2">
                  <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Type & Schedule</p>
                    <p className="text-base text-gray-900">
                      {jobData.jobType && <span>{jobData.jobType}</span>}
                      {jobData.jobType && jobData.schedule && <span> • </span>}
                      {jobData.schedule && <span>{jobData.schedule}</span>}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Requirements */}
            {jobData.requirements && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Requirements</p>
                    <p className="text-sm text-gray-700">{jobData.requirements}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Deal Breakers */}
            {jobData.dealBreakers && jobData.dealBreakers.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-600 mb-2">Deal Breakers</p>
                <ul className="space-y-1">
                  {jobData.dealBreakers.map((item, idx) => (
                    <li key={idx} className="text-sm text-red-700 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Build Job Ad Button */}
            {hasEnoughData && (
              <div className="pt-4">
                <button
                  onClick={handleBuildJobAd}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-[1.02] shadow-lg"
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Build Job Ad</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-xs text-gray-600 text-center mt-2">
                  You can edit everything in the next step
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}