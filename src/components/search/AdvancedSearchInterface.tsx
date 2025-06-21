'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Sparkles,
  Brain,
  RefreshCw,
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
  const [filters, setFilters] = useState<SearchFilters>({
    salaryMin: 40000,
    salaryMax: 200000,
    skills: [],
  });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

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

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="border-2 border-gray-200 hover:border-green-300 transition-colors">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">AI-Powered Job Search</CardTitle>
            </div>
            
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
            <div className="relative">
              <Textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
