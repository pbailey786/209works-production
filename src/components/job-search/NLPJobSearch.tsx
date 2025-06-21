import React, { useState, useEffect, useRef } from '@/components/ui/card';
import { motion, AnimatePresence } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';import {
  Search,
  Sparkles,
  ArrowRight,
  MapPin,
  Briefcase,
  Clock,
  DollarSign
} from 'lucide-react';

interface NLPJobSearchProps {
  onSearch: (query: string) => void;
  loading?: boolean;
  className?: string;
}

const searchSuggestions = [
  'Remote warehouse job near Modesto',
  'Part-time retail cashier in Tracy with flexible hours',
  'Entry-level forklift operator in Stockton, $18+ per hour',
  'School janitor positions in Lodi with benefits',
  'Delivery driver jobs in Manteca, weekends off',
  'Customer service representative, work from home',
  'Administrative assistant in Central Valley, full-time',
  'Manufacturing jobs in Stockton with overtime pay',
];

const quickFilters = [
  { icon: MapPin, label: 'Remote Only', query: 'remote jobs' },
  { icon: Clock, label: 'Part-Time', query: 'part-time positions' },
  {
    icon: DollarSign,
    label: '$20+ /hour',
    query: 'jobs paying $20 or more per hour'
  },
  { icon: Briefcase, label: 'Entry Level', query: 'entry level positions' },
];

export default function NLPJobSearch({
  onSearch,
  loading = false,
  className
}: NLPJobSearchProps) {
  const [query, setQuery] = useState('');
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Rotate suggestions every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestion(prev => (prev + 1) % searchSuggestions.length);
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
    <div className={cn('mx-auto w-full max-w-4xl', className)}>
      {/* Main Search Interface */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            'relative rounded-2xl border-2 bg-white shadow-lg transition-all duration-300',
            isFocused ? 'border-blue-500 shadow-xl' : 'border-gray-200',
            'hover:border-gray-300 hover:shadow-xl'
          )}
        >
          {/* AI Icon */}
          <div className="absolute left-6 top-6 z-10">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
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
              'w-full resize-none rounded-2xl border-0 py-6 pl-16 pr-20 text-lg',
              'placeholder-gray-400 focus:outline-none focus:ring-0',
              'max-h-[200px] min-h-[80px] leading-relaxed'
            )}
            rows={1}
            style={{
              height: 'auto',
              minHeight: '80px'
            }}
          />

          {/* Submit Button */}
          <div className="absolute bottom-4 right-4">
            <Button
              type="submit"
              disabled={!query.trim() || loading}
              className={cn(
                'h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600',
                'transition-all duration-200 hover:from-blue-600 hover:to-purple-700',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'flex items-center justify-center'
              )}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ArrowRight className="h-5 w-5 text-white" />
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
              <p className="mb-3 text-sm text-gray-500">Try asking:</p>
              <AnimatePresence mode="wait">
                <motion.button
                  key={currentSuggestion}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  onClick={() =>
                    handleSuggestionClick(searchSuggestions[currentSuggestion])
                  }
                  className={cn(
                    'text-lg font-medium text-blue-600 hover:text-blue-700',
                    'cursor-pointer transition-colors duration-200 hover:underline',
                    'mx-auto block max-w-2xl rounded-lg px-4 py-2',
                    'hover:bg-blue-50'
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
                      'flex items-center gap-2 border border-gray-200 bg-white px-4 py-3',
                      'rounded-xl transition-all duration-200 hover:border-blue-300 hover:bg-blue-50',
                      'text-sm font-medium text-gray-700 hover:text-blue-700',
                      'shadow-sm hover:shadow-md'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {filter.label}
                  </motion.button>
                );
              })}
            </div>

            {/* Additional Suggestions Grid */}
            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 md:grid-cols-2">
              {searchSuggestions.slice(0, 4).map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'rounded-xl bg-gray-50 p-4 text-left hover:bg-gray-100',
                    'border border-gray-200 transition-all duration-200 hover:border-gray-300',
                    'text-sm text-gray-700 hover:text-gray-900'
                  )}
                >
                  <Search className="mb-2 h-4 w-4 text-gray-400" />
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
