/**
 * Mobile-Optimized Chat Input Component
 * 
 * Features:
 * - Thumb-friendly touch targets (44px+)
 * - Voice button in thumb zone (left side)
 * - Smart textarea expansion
 * - Better mobile keyboard handling
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';

interface MobileOptimizedInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onVoiceToggle?: () => void;
  isLoading?: boolean;
  isListening?: boolean;
  speechSupported?: boolean;
  placeholder?: string;
}

export default function MobileOptimizedInput({
  value,
  onChange,
  onSubmit,
  onVoiceToggle,
  isLoading = false,
  isListening = false,
  speechSupported = false,
  placeholder = "Ask me about jobs in the 209..."
}: MobileOptimizedInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(1);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = 24; // approximate line height
      const newRows = Math.min(Math.max(Math.ceil(scrollHeight / lineHeight), 1), 4);
      setRows(newRows);
      textarea.style.height = `${Math.min(scrollHeight, lineHeight * 4)}px`;
    }
  }, [value]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4 safe-area-inset-bottom">
      <div className="mx-auto max-w-4xl">
        {/* Quick Action Buttons (Mobile) */}
        <div className="mb-3 flex space-x-2 overflow-x-auto pb-2 md:hidden">
          {[
            "Warehouse jobs in Stockton",
            "Healthcare jobs near me", 
            "Customer service remote",
            "High paying jobs"
          ].map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSubmit(suggestion)}
              className="flex-shrink-0 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Input Container */}
        <div className="relative">
          <div className="flex items-end space-x-3">
            {/* Voice Button - Left side for thumb accessibility */}
            {speechSupported && (
              <button
                onClick={onVoiceToggle}
                disabled={isLoading}
                className={`flex-shrink-0 rounded-full p-3 transition-all duration-200 ${
                  isListening
                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse scale-110'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ minWidth: '48px', minHeight: '48px' }}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? (
                  <StopIcon className="h-6 w-6" />
                ) : (
                  <MicrophoneIcon className="h-6 w-6" />
                )}
              </button>
            )}

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "🎤 Listening... Speak now!" : placeholder}
                className={`w-full resize-none rounded-2xl border-2 px-4 py-3 pr-14 text-base transition-all duration-200 focus:outline-none focus:ring-4 ${
                  isListening
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                    : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 bg-white'
                }`}
                rows={rows}
                disabled={isLoading}
                style={{ 
                  minHeight: '48px',
                  fontSize: '16px' // Prevents zoom on iOS
                }}
              />

              {/* Send Button - Inside input for easier thumb reach */}
              <button
                onClick={handleSubmit}
                disabled={!value.trim() || isLoading}
                className="absolute bottom-2 right-2 rounded-full bg-orange-500 p-2 text-white hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ minWidth: '40px', minHeight: '40px' }}
                title="Send message"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Character count for longer messages */}
          {value.length > 200 && (
            <div className="mt-2 text-right">
              <span className={`text-xs ${value.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                {value.length}/500
              </span>
            </div>
          )}
        </div>

        {/* Help text */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            {speechSupported && <span>🎤 Voice input • </span>}
            <span className="font-medium text-orange-600">JobsGPT</span> understands Central Valley geography
          </p>
        </div>
      </div>
    </div>
  );
}