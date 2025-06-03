import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface JobGenieContextInfo {
  hasCompanyInfo: boolean;
  hasKnowledgeBase: boolean;
  knowledgeCategories: string[];
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  contextInfo: JobGenieContextInfo | null;
  onSendMessage: (content: string) => void;
  jobTitle: string;
  company: string;
}

export default function ChatWindow({
  isOpen,
  onClose,
  messages,
  isLoading,
  error,
  contextInfo,
  onSendMessage,
  jobTitle,
  company,
}: ChatWindowProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl"
      >
        <ChatHeader onClose={onClose} contextInfo={contextInfo} />

        <MessageList
          messages={messages}
          isLoading={isLoading}
          jobTitle={jobTitle}
          company={company}
        />

        {error && (
          <div className="border-t border-red-200 bg-red-50 px-4 py-2">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
      </motion.div>
    </AnimatePresence>
  );
}
