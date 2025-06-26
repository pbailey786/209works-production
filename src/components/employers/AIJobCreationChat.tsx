'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowRight, FileText } from 'lucide-react';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

interface JobData {
  title?: string;
  description?: string;
  requirements?: string;
  salary?: string;
  location?: string;
  jobType?: string;
  urgency?: string;
  dealBreakers?: string[];
  priorities?: string[];
  contactMethod?: string;
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

  const handleReviewJob = () => {
    onJobComplete(jobData);
  };

  return (
    <div className="max-w-4xl mx-auto h-[600px] flex flex-col bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Job Genie 🧞‍♂️</h2>
            <p className="text-sm text-gray-600">Your magical job posting assistant</p>
          </div>
        </div>
        
        {isComplete && (
          <button
            onClick={handleReviewJob}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Review Job Post</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                )}
                {message.role === 'user' && (
                  <User className="w-5 h-5 text-blue-100 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  {message.role === 'assistant' && message.content.includes('"title"') && message.content.includes('"description"') ? (
                    // Format JSON job data nicely
                    <div className="space-y-3">
                      <p className="font-semibold text-blue-900 mb-2">✨ Here's your job posting:</p>
                      {(() => {
                        try {
                          const jobData = JSON.parse(message.content);
                          return (
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h3 className="font-bold text-lg mb-2">{jobData.title}</h3>
                              <div className="space-y-2 text-sm">
                                <p><span className="font-medium">📍 Location:</span> {jobData.location}</p>
                                <p><span className="font-medium">💼 Type:</span> {jobData.type || jobData.jobType}</p>
                                <p><span className="font-medium">💰 Salary:</span> {jobData.salary}</p>
                                {jobData.schedule && <p><span className="font-medium">🕐 Schedule:</span> {jobData.schedule}</p>}
                                <div className="mt-3">
                                  <p className="font-medium mb-1">📝 Description:</p>
                                  <p className="text-gray-700">{jobData.description}</p>
                                </div>
                                {jobData.requirements && (
                                  <div className="mt-3">
                                    <p className="font-medium mb-1">✅ Requirements:</p>
                                    <p className="text-gray-700">{jobData.requirements}</p>
                                  </div>
                                )}
                                {jobData.responsibilities && Array.isArray(jobData.responsibilities) && (
                                  <div className="mt-3">
                                    <p className="font-medium mb-1">📋 Responsibilities:</p>
                                    <ul className="list-disc list-inside text-gray-700">
                                      {jobData.responsibilities.map((resp: string, idx: number) => (
                                        <li key={idx}>{resp}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <p className="mt-3"><span className="font-medium">📧 Contact:</span> {jobData.contact || jobData.contactMethod}</p>
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return <p className="whitespace-pre-wrap">{message.content}</p>;
                        }
                      })()}
                      <p className="text-sm text-gray-600 mt-2">
                        👆 This is a preview of your job post. You can review and edit it in the next step!
                      </p>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className={`text-xs mt-1 ${
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
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex items-center space-x-2">
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

      {/* Job Data Preview */}
      {Object.keys(jobData).length > 0 && (
        <div className="border-t bg-gray-50 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Job Details Collected:</h4>
          <div className="flex flex-wrap gap-2">
            {jobData.title && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Title: {jobData.title}
              </span>
            )}
            {jobData.salary && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Salary: {jobData.salary}
              </span>
            )}
            {jobData.urgency && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                Urgency: {jobData.urgency}
              </span>
            )}
            {jobData.contactMethod && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                Contact: {jobData.contactMethod}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your response..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • The AI will guide you through creating the perfect job post
        </p>
      </div>
    </div>
  );
}