'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Sparkles,
  Filter,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Brain,
  Target,
  Zap,
  TrendingUp,
  Star,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkPlus
} from 'lucide-react';

interface SearchFilters {
  jobType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  remote?: boolean;
  location?: string;
  skills?: string[];
}

interface SearchResult {
  job: any;
  semanticScore: number;
  relevanceScore: number;
  matchedConcepts: string[];
  explanation: string;
}

interface AdvancedSearchInterfaceProps {
  onSearch: (query: string, filters: SearchFilters, searchType: 'traditional' | 'semantic') => void;
  onResults: (results: SearchResult[]) => void;
  loading?: boolean;
  className?: string;
}

export default function AdvancedSearchInterface({
  onSearch,
  onResults,
  loading = false,
  className = '',
}: AdvancedSearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'traditional' | 'semantic'>('semantic');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    salaryMin: 40000,
    salaryMax: 200000,
    skills: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveAlertEnabled, setSaveAlertEnabled] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Smart search suggestions
  const searchSuggestions = [
    "Find me a remote software engineering job with Python and React",
    "I want to work at a startup doing machine learning in the Bay Area",
    "Looking for entry-level marketing positions with growth opportunities",
    "Senior developer role with flexible hours and good work-life balance",
    "Data analyst position at a healthcare company with competitive salary",
    "Product manager job at a tech company with equity compensation",
  ];

  // Auto-rotate suggestions
  useEffect(() => {
    if (!query && showSuggestions) {
      const interval = setInterval(() => {
        setSuggestions(prev => {
          const current = prev.length > 0 ? prev : searchSuggestions;
          return [current[1], current[2], current[0]].filter(Boolean);
        });
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [query, showSuggestions]);

  // Initialize suggestions
  useEffect(() => {
    setSuggestions(searchSuggestions.slice(0, 3));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setShowSuggestions(false);
    onSearch(query.trim(), filters, searchType);

    // Perform search based on type
    if (searchType === 'semantic') {
      await performSemanticSearch();
    } else {
      await performTraditionalSearch();
    }
  };

  const performSemanticSearch = async () => {
    try {
      const response = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          filters,
          limit: 20,
          threshold: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onResults(data.data.results);
      }
    } catch (error) {
      console.error('Semantic search error:', error);
    }
  };

  const performTraditionalSearch = async () => {
    try {
      const params = new URLSearchParams({
        q: query,
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(',') : String(value)
          ])
        ),
      });

      const response = await fetch(`/api/jobs/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        // Convert traditional results to match semantic format
        const formattedResults = data.data.jobs.map((job: any) => ({
          job,
          semanticScore: 0,
          relevanceScore: 1,
          matchedConcepts: [],
          explanation: 'Traditional keyword match',
        }));
        onResults(formattedResults);
      }
    } catch (error) {
      console.error('Traditional search error:', error);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !filters.skills?.includes(skillInput.trim())) {
      setFilters(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills?.filter(s => s !== skill) || [],
    }));
  };

  const clearFilters = () => {
    setFilters({
      salaryMin: 40000,
      salaryMax: 200000,
      skills: [],
    });
  };

  const useSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const saveSearch = async () => {
    if (!saveName.trim() || !query.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a name and search query',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim(),
          query: query.trim(),
          filters,
          alertEnabled: saveAlertEnabled,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Search Saved',
          description: `"${saveName}" has been saved to your searches`,
        });
        setShowSaveDialog(false);
        setSaveName('');
        setSaveAlertEnabled(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save search');
      }
    } catch (error) {
      console.error('Error saving search:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save search',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Search Interface */}
      <Card className="border-2 border-gray-200 hover:border-green-300 transition-colors">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">AI-Powered Job Search</CardTitle>
            </div>
            
            {/* Search Type Toggle */}
            <Tabs value={searchType} onValueChange={(value) => setSearchType(value as any)}>
              <TabsList className="grid w-fit grid-cols-2">
                <TabsTrigger value="semantic" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Search
                </TabsTrigger>
                <TabsTrigger value="traditional" className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Traditional
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <CardDescription>
            {searchType === 'semantic' 
              ? 'Describe what you\'re looking for in natural language. Our AI will understand your intent and find the best matches.'
              : 'Search using keywords and filters for precise results.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(!query)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={
                  searchType === 'semantic'
                    ? "e.g., 'I want a remote software engineering job with Python and React, good work-life balance, and competitive salary'"
                    : "e.g., 'software engineer python react'"
                }
                className="min-h-[80px] resize-none pr-12"
                disabled={loading}
              />
              
              <Button
                type="submit"
                size="sm"
                className="absolute bottom-2 right-2"
                disabled={loading || !query.trim()}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Search Suggestions */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Zap className="h-3 w-3" />
                    Try these AI-powered searches:
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={suggestion}
                      type="button"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => useSuggestion(suggestion)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg text-sm transition-colors border border-transparent hover:border-green-200"
                    >
                      "{suggestion}"
                    </motion.button>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Advanced Filters Toggle */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {query.trim() && (
                  <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <BookmarkPlus className="h-4 w-4" />
                        Save Search
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Search</DialogTitle>
                        <DialogDescription>
                          Save this search to quickly access it later and optionally receive alerts for new matches.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="search-name">Search Name</Label>
                          <Input
                            id="search-name"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            placeholder="e.g., Remote Software Engineer Jobs"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="alert-enabled"
                            checked={saveAlertEnabled}
                            onCheckedChange={setSaveAlertEnabled}
                          />
                          <Label htmlFor="alert-enabled">
                            Enable alerts for new matches
                          </Label>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowSaveDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={saveSearch} disabled={!saveName.trim()}>
                            Save Search
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {Object.keys(filters).some(key => 
                key !== 'salaryMin' && key !== 'salaryMax' && filters[key as keyof SearchFilters]
              ) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear Filters
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Advanced Search Filters
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Job Type and Experience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Job Type
                    </Label>
                    <Select
                      value={filters.jobType || ''}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, jobType: value || undefined }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any job type</SelectItem>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Experience Level
                    </Label>
                    <Select
                      value={filters.experienceLevel || ''}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, experienceLevel: value || undefined }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any experience level</SelectItem>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="principal">Principal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location and Remote */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </Label>
                    <Input
                      value={filters.location || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value || undefined }))}
                      placeholder="City, State, or 'Remote'"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Remote Work
                    </Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        checked={filters.remote || false}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, remote: checked }))}
                      />
                      <Label>Remote positions only</Label>
                    </div>
                  </div>
                </div>

                {/* Salary Range */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Salary Range: ${filters.salaryMin?.toLocaleString()} - ${filters.salaryMax?.toLocaleString()}
                  </Label>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-600">Minimum Salary</Label>
                      <Slider
                        value={[filters.salaryMin || 40000]}
                        onValueChange={([value]) => setFilters(prev => ({ ...prev, salaryMin: value }))}
                        max={300000}
                        min={20000}
                        step={5000}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Maximum Salary</Label>
                      <Slider
                        value={[filters.salaryMax || 200000]}
                        onValueChange={([value]) => setFilters(prev => ({ ...prev, salaryMax: value }))}
                        max={500000}
                        min={30000}
                        step={5000}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Required Skills
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      placeholder="Add a skill (e.g., React, Python, SQL)"
                      className="flex-1"
                    />
                    <Button type="button" onClick={addSkill} size="sm">
                      Add
                    </Button>
                  </div>
                  
                  {filters.skills && filters.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {filters.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
