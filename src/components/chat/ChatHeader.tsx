import React from 'react';
import {
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface JobGenieContextInfo {
  hasCompanyInfo: boolean;
  hasKnowledgeBase: boolean;
  knowledgeCategories: string[];
}

interface ChatHeaderProps {
  onClose: () => void;
  contextInfo: JobGenieContextInfo | null;
}

export default function ChatHeader({ onClose, contextInfo }: ChatHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] text-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-[#9fdf9f]/20 rounded-full p-1">
            <SparklesIcon className="w-5 h-5 text-[#9fdf9f]" />
          </div>
          <div>
            <h3 className="font-semibold">JobsGPT</h3>
            <p className="text-xs opacity-90">Ask me about this job</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 rounded"
          aria-label="Close chat"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      
      {/* Context Indicator */}
      {contextInfo && (
        <div className="mt-2 text-xs">
          <div className="flex items-center space-x-2 text-white/80">
            <div className="w-2 h-2 bg-[#9fdf9f] rounded-full"></div>
            <span>
              Connected • {contextInfo.hasCompanyInfo ? 'Company info loaded' : 'Basic info loaded'}
              {contextInfo.hasKnowledgeBase && ` • ${contextInfo.knowledgeCategories.length} knowledge categories`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 