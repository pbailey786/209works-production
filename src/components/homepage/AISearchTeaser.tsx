/**
 * AI Search Teaser Component
 * 
 * Simple search input that redirects to full /chat experience
 * Keeps homepage focused while promoting AI capabilities
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles } from 'lucide-react';

export default function AISearchTeaser() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (query: string) => {
    const searchText = query.trim() || 'jobs in the 209 area';
    router.push(`/chat?q=${encodeURIComponent(searchText)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const suggestedSearches = [
    "Find warehouse jobs in Stockton",
    "Show me healthcare jobs in Modesto", 
    "Local customer service jobs",
    "What jobs pay well in Tracy?"
  ];

  return (
    <div className="mx-auto max-w-4xl">
      {/* AI Search Input */}
      <form onSubmit={handleSubmit} className="relative mb-8">
        <div className="rounded-3xl border border-gray-200/60 bg-white/90 p-4 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-600">AI</span>
              </div>
              <input
                type="text"
                placeholder="Ask JobsGPT: 'Find warehouse jobs in Stockton' or 'What pays well in Tracy?'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 py-4 pl-20 pr-6 text-lg transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="submit"
              className="group flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105"
            >
              <span>Ask AI</span>
              <Search className="h-5 w-5 transition-transform group-hover:scale-110" />
            </button>
          </div>
        </div>
      </form>

      {/* Suggested Searches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestedSearches.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSearch(suggestion)}
            className="group flex items-center justify-between rounded-2xl border-2 border-gray-200 bg-white/80 p-4 text-left backdrop-blur-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:scale-105"
          >
            <div className="flex items-center space-x-3">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-gray-700 font-medium">{suggestion}</span>
            </div>
            <Search className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </button>
        ))}
      </div>

      {/* AI Explanation */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-blue-600">JobsGPT</span> understands Central Valley geography and job market.
          <span className="block mt-1">Ask questions like you'd ask a local friend.</span>
        </p>
      </div>
    </div>
  );
}