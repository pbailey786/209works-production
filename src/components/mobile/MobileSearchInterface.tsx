'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  MapPin, 
  DollarSign,
  Briefcase,
  Clock,
  Sliders,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchFilters {
  location?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  remote?: boolean;
  postedWithin?: string;
}

interface MobileSearchInterfaceProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  initialQuery?: string;
  initialFilters?: SearchFilters;
  isLoading?: boolean;
  className?: string;
}

export default function MobileSearchInterface({
  onSearch,
  initialQuery = '',
  initialFilters = {},
  isLoading = false,
  className = '',
}: MobileSearchInterfaceProps) {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: 'Voice search error',
          description: 'Could not process voice input. Please try again.',
          variant: 'destructive',
        });
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [toast]);

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleVoiceSearch = () => {
    if (!recognition) {
      toast({
        title: 'Voice search not supported',
        description: 'Your browser does not support voice search.',
        variant: 'destructive',
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setShowFilters(false);
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== '' && value !== false
    ).length;
  };

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'];
  const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'];
  const postedWithinOptions = [
    { label: 'Last 24 hours', value: '1d' },
    { label: 'Last 3 days', value: '3d' },
    { label: 'Last week', value: '7d' },
    { label: 'Last month', value: '30d' },
  ];

  return (
    <div className={`bg-white ${className}`}>
      {/* Main search bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search jobs, companies, or keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-20 py-3 text-base"
            />
            
            {/* Voice search button */}
            {recognition && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceSearch}
                className={`absolute right-12 p-2 ${isListening ? 'text-red-500' : 'text-gray-400'}`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            
            {/* Filter toggle button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-2 p-2"
            >
              <div className="relative">
                <Filter className="h-4 w-4" />
                {getActiveFilterCount() > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                    variant="destructive"
                  >
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </div>
            </Button>
          </div>
        </div>

        {/* Search button */}
        <Button
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full mt-3"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Searching...
            </div>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search Jobs
            </>
          )}
        </Button>

        {/* Voice listening indicator */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center gap-2 text-red-700">
              <div className="animate-pulse">
                <Mic className="h-4 w-4" />
              </div>
              <span className="text-sm">Listening... Speak now</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-b border-gray-200"
          >
            <div className="p-4 space-y-4">
              {/* Filter header */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Filters</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    Clear all
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Location filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </label>
                <Input
                  type="text"
                  placeholder="City, state, or zip code"
                  value={filters.location || ''}
                  onChange={(e) => updateFilter('location', e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Job type filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="h-4 w-4 inline mr-1" />
                  Job Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {jobTypes.map((type) => (
                    <Button
                      key={type}
                      variant={filters.jobType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilter('jobType', filters.jobType === type ? '' : type)}
                      className="text-xs"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Salary range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Salary Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min salary"
                    value={filters.salaryMin || ''}
                    onChange={(e) => updateFilter('salaryMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max salary"
                    value={filters.salaryMax || ''}
                    onChange={(e) => updateFilter('salaryMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Experience level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {experienceLevels.map((level) => (
                    <Button
                      key={level}
                      variant={filters.experienceLevel === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilter('experienceLevel', filters.experienceLevel === level ? '' : level)}
                      className="text-xs"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Posted within */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Posted Within
                </label>
                <div className="flex flex-wrap gap-2">
                  {postedWithinOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={filters.postedWithin === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilter('postedWithin', filters.postedWithin === option.value ? '' : option.value)}
                      className="text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Remote work toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Remote Work Only
                </label>
                <Button
                  variant={filters.remote ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter('remote', !filters.remote)}
                  className="text-xs"
                >
                  {filters.remote ? 'Yes' : 'No'}
                </Button>
              </div>

              {/* Apply filters button */}
              <Button
                onClick={() => {
                  handleSearch();
                  setShowFilters(false);
                }}
                className="w-full"
              >
                Apply Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filters display */}
      {getActiveFilterCount() > 0 && !showFilters && (
        <div className="p-4 bg-gray-50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {Object.entries(filters).map(([key, value]) => {
              if (!value || value === false) return null;
              
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  {key === 'location' && <MapPin className="h-3 w-3" />}
                  {key === 'jobType' && <Briefcase className="h-3 w-3" />}
                  {key === 'salaryMin' && <DollarSign className="h-3 w-3" />}
                  {key === 'salaryMax' && <DollarSign className="h-3 w-3" />}
                  {key === 'postedWithin' && <Clock className="h-3 w-3" />}
                  
                  <span>
                    {key === 'salaryMin' ? `$${value}k+` :
                     key === 'salaryMax' ? `<$${value}k` :
                     key === 'remote' ? 'Remote' :
                     key === 'postedWithin' ? postedWithinOptions.find(o => o.value === value)?.label :
                     String(value)}
                  </span>
                  
                  <button
                    onClick={() => updateFilter(key as keyof SearchFilters, undefined)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-red-600"
            >
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
