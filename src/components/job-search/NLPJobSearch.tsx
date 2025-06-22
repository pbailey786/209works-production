'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Search, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import JobCard from '@/components/JobCard';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  postedAt: string;
  description: string;
}

interface SearchMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant' | 'results';
  timestamp: Date;
  jobs?: Job[];
}

interface NLPJobSearchProps {
  onJobSelect?: (job: Job) => void;
  className?: string;
}

export default function NLPJobSearch({ onJobSelect, className = '' }: NLPJobSearchProps) {
  const [messages, setMessages] = useState<SearchMessage[]>([
    {
      id: '1',
      content: "Hi! I'm your AI job search assistant. Tell me what kind of job you're looking for in natural language. For example: 'I want a warehouse job in Stockton that pays at least $20/hour' or 'Find me part-time retail positions near Tracy'.",
      type: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSearch = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: SearchMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/jobs/nlp-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: inputMessage
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: SearchMessage = {
          id: (Date.now() + 1).toString(),
          content: data.interpretation || `I found ${data.jobs?.length || 0} jobs matching your criteria.`,
          type: 'assistant',
          timestamp: new Date()
        };

        const resultsMessage: SearchMessage = {
          id: (Date.now() + 2).toString(),
          content: '',
          type: 'results',
          timestamp: new Date(),
          jobs: data.jobs || []
        };

        setMessages(prev => [...prev, assistantMessage, resultsMessage]);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('NLP Search error:', error);
      const errorMessage: SearchMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble searching right now. Please try a simpler query or use the traditional search.",
        type: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const suggestedQueries = [
    "Warehouse jobs in Stockton paying $20+ per hour",
    "Part-time retail positions in Modesto",
    "Office jobs near Tracy with benefits",
    "Entry-level positions in Manteca",
    "Full-time manufacturing jobs in Lodi"
  ];

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Job Search
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Describe what you're looking for in natural language and I'll find matching jobs in the 209 area.
          </p>
        </CardHeader>

        <CardContent>
          {/* Messages */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id}>
                {message.type === 'user' && (
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-xs">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                )}

                {message.type === 'assistant' && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 max-w-xs">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                )}

                {message.type === 'results' && message.jobs && (
                  <div className="space-y-3">
                    {message.jobs.map((job) => (
                      <JobCard
                        key={job.id}
                        {...job}
                        onViewDetails={() => onJobSelect?.(job)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe the job you're looking for..."
                  className="w-full resize-none rounded-lg border border-border p-3 pr-12 focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={2}
                />
                <Button
                  onClick={handleSearch}
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                  className="absolute right-2 top-2"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Suggested Queries */}
            {messages.length === 1 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQueries.map((query, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMessage(query)}
                      className="text-xs"
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
