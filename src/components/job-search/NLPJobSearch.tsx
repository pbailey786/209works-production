import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, ArrowRight, MapPin, Briefcase, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NLPJobSearchProps {
  onSearch: (query: string) => void;
  loading?: boolean;
  className?: string;
}

const searchSuggestions = [
  "Remote warehouse job near Modesto",
  "Part-time retail cashier in Tracy with flexible hours",
  "Entry-level forklift operator in Stockton, $18+ per hour",
  "School janitor positions in Lodi with benefits",
  "Delivery driver jobs in Manteca, weekends off",
  "Customer service representative, work from home",
  "Administrative assistant in Central Valley, full-time",
  "Manufacturing jobs in Stockton with overtime pay"
];

const quickFilters = [
  { icon: MapPin, label: "Remote Only", query: "remote jobs" },
  { icon: Clock, label: "Part-Time", query: "part-time positions" },
  { icon: DollarSign, label: "$20+ /hour", query: "jobs paying $20 or more per hour" },
  { icon: Briefcase, label: "Entry Level", query: "entry level positions" }
];

export default function NLPJobSearch({ onSearch, loading = false, className }: NLPJobSearchProps) {
  const [query, setQuery] = useState('');
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Rotate suggestions every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestion((prev) => (prev + 1) % searchSuggestions.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const handleQuickFilter = (filterQuery: string) => {
    setQuery(filterQuery);
    onSearch(filterQuery);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(e.target.value.length === 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      {/* Main Search Interface */}
      <form onSubmit={handleSubmit} className="relative">
        <div className={cn(
          "relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300",
          isFocused ? "border-blue-500 shadow-xl" : "border-gray-200",
          "hover:shadow-xl hover:border-gray-300"
        )}>
          {/* AI Icon */}
          <div className="absolute left-6 top-6 z-10">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Text Area */}
          <textarea
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="e.g., Part-time warehouse job in Stockton with weekends off, $18+ per hour"
            className={cn(
              "w-full pl-16 pr-20 py-6 text-lg resize-none border-0 rounded-2xl",
              "focus:outline-none focus:ring-0 placeholder-gray-400",
              "min-h-[80px] max-h-[200px] leading-relaxed"
            )}
            rows={1}
            style={{ 
              height: 'auto',
              minHeight: '80px'
            }}
          />

          {/* Submit Button */}
          <div className="absolute right-4 bottom-4">
            <Button
              type="submit"
              disabled={!query.trim() || loading}
              className={cn(
                "h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600",
                "hover:from-blue-600 hover:to-purple-700 transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center"
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 text-white" />
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Suggestions and Quick Filters */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-6 space-y-6"
          >
            {/* Rotating Suggestion */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Try asking:</p>
              <AnimatePresence mode="wait">
                <motion.button
                  key={currentSuggestion}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => handleSuggestionClick(searchSuggestions[currentSuggestion])}
                  className={cn(
                    "text-blue-600 hover:text-blue-700 font-medium text-lg",
                    "hover:underline transition-colors duration-200 cursor-pointer",
                    "block mx-auto max-w-2xl px-4 py-2 rounded-lg",
                    "hover:bg-blue-50"
                  )}
                >
                  "{searchSuggestions[currentSuggestion]}"
                </motion.button>
              </AnimatePresence>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              {quickFilters.map((filter, index) => {
                const Icon = filter.icon;
                return (
                  <motion.button
                    key={filter.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleQuickFilter(filter.query)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 bg-white border border-gray-200",
                      "rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200",
                      "text-gray-700 hover:text-blue-700 font-medium text-sm",
                      "shadow-sm hover:shadow-md"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </motion.button>
                );
              })}
            </div>

            {/* Additional Suggestions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
              {searchSuggestions.slice(0, 4).map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-xl",
                    "border border-gray-200 hover:border-gray-300 transition-all duration-200",
                    "text-gray-700 hover:text-gray-900 text-sm"
                  )}
                >
                  <Search className="w-4 h-4 text-gray-400 mb-2" />
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 