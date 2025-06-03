import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  jobTitle: string;
  company: string;
  onQuickQuestion?: (question: string) => void;
}

const quickQuestions = [
  'What are the main requirements for this role?',
  'Tell me about the company culture',
  'What benefits does this position offer?',
  'Is remote work available?',
  "What's the interview process like?",
];

export default function MessageList({
  messages,
  isLoading,
  jobTitle,
  company,
  onQuickQuestion,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp: Date) => {
    try {
      return timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-h-96 flex-1 space-y-4 overflow-y-auto p-4">
      {messages.length === 0 && !isLoading && (
        <div className="py-8 text-center text-gray-500">
          <p className="mb-4">
            Ask me anything about this {jobTitle} position at {company}!
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Quick questions:
            </p>
            {quickQuestions.slice(0, 3).map((question, index) => (
              <button
                key={index}
                onClick={() => onQuickQuestion?.(question)}
                className="block w-full rounded p-2 text-left text-sm text-purple-600 transition hover:bg-purple-50 hover:text-purple-800"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              message.role === 'user'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            <p
              className={`mt-1 text-xs ${
                message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
              }`}
            >
              {formatTime(message.timestamp)}
            </p>
          </div>
        </motion.div>
      ))}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
        >
          <div className="rounded-lg bg-gray-100 p-3">
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
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
