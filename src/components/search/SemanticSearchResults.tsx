'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from 'lucide-react';

interface SemanticSearchResult {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    experienceLevel: string;
    salaryMin?: number;
    salaryMax?: number;
    description: string;
    categories: string[];
    skills: string[];
    remote: boolean;
    featured: boolean;
    createdAt: string;
    applicationCount: number;
  };
  semanticScore: number;
  relevanceScore: number;
  matchedConcepts: string[];
  explanation: string;
}

interface SemanticSearchResultsProps {
  results: SemanticSearchResult[];
  query: string;
  loading?: boolean;
  searchType: 'traditional' | 'semantic';
  onJobClick?: (jobId: string) => void;
  onSaveJob?: (jobId: string) => void;
  className?: string;
}

export default function SemanticSearchResults({
  results,
  query,
  loading = false,
  searchType,
  onJobClick,
  onSaveJob,
  className = ''
}: SemanticSearchResultsProps) {
  const [sortBy, setSortBy] = useState<'relevance' | 'semantic' | 'salary' | 'date'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showExplanations, setShowExplanations] = useState(true);

  const sortedResults = [...results].sort((a, b) => {
    let aValue: number, bValue: number;
    
    switch (sortBy) {
      case 'semantic':
        aValue = a.semanticScore;
        bValue = b.semanticScore;
        break;
      case 'salary':
        aValue = a.job.salaryMin || 0;
        bValue = b.job.salaryMin || 0;
        break;
      case 'date':
        aValue = new Date(a.job.createdAt).getTime();
        bValue = new Date(b.job.createdAt).getTime();
        break;
      case 'relevance':
      default:
        aValue = (a.semanticScore * 0.7) + (a.relevanceScore * 0.3);
        bValue = (b.semanticScore * 0.7) + (b.relevanceScore * 0.3);
        break;
    }
    
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max?.toLocaleString()}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just posted';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No jobs found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or filters to find more opportunities
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>• Use different keywords or synonyms</p>
            <p>• Broaden your location or salary range</p>
            <p>• Try our AI search for semantic matching</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {searchType === 'semantic' ? (
                  <Brain className="h-5 w-5 text-green-600" />
                ) : (
                  <Target className="h-5 w-5 text-blue-600" />
                )}
                Search Results
              </CardTitle>
              <CardDescription>
                Found {results.length} jobs matching "{query}"
                {searchType === 'semantic' && ' using AI semantic search'}
              </CardDescription>
            </div>
            
            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="relevance">Relevance</option>
                {searchType === 'semantic' && <option value="semantic">AI Score</option>}
                <option value="salary">Salary</option>
                <option value="date">Date Posted</option>
              </select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              >
                {sortOrder === 'desc' ? (
                  <SortDesc className="h-4 w-4" />
                ) : (
                  <SortAsc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {searchType === 'semantic' && (
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExplanations(!showExplanations)}
                className="text-xs"
              >
                <Info className="h-3 w-3 mr-1" />
                {showExplanations ? 'Hide' : 'Show'} AI Explanations
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Results List */}
      <div className="space-y-4">
        <AnimatePresence>
          {sortedResults.map((result, index) => (
            <motion.div
              key={result.job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 
                          className="text-xl font-semibold hover:text-green-600 transition-colors"
                          onClick={() => onJobClick?.(result.job.id)}
                        >
                          {result.job.title}
                        </h3>
                        {result.job.featured && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {result.job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {result.job.location}
                          {result.job.remote && ' (Remote)'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {getTimeAgo(result.job.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <DollarSign className="h-4 w-4" />
                          {formatSalary(result.job.salaryMin, result.job.salaryMax)}
                        </span>
                        <Badge variant="outline">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {result.job.jobType}
                        </Badge>
                        <Badge variant="outline">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {result.job.experienceLevel}
                        </Badge>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="text-right space-y-2">
                      {searchType === 'semantic' && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">AI Match</div>
                          <Badge className={getScoreColor(result.semanticScore)}>
                            {Math.round(result.semanticScore * 100)}%
                          </Badge>
                        </div>
                      )}
                      
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Relevance</div>
                        <Badge className={getScoreColor(result.relevanceScore)}>
                          {Math.round(result.relevanceScore * 100)}%
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  {searchType === 'semantic' && showExplanations && result.explanation && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-blue-900 mb-1">
                            Why this job matches:
                          </div>
                          <div className="text-sm text-blue-800">
                            {result.explanation}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Matched Concepts */}
                  {searchType === 'semantic' && result.matchedConcepts.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-2">Matched concepts:</div>
                      <div className="flex flex-wrap gap-1">
                        {result.matchedConcepts.map((concept) => (
                          <Badge key={concept} variant="secondary" className="text-xs">
                            {concept}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {result.job.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-2">Required skills:</div>
                      <div className="flex flex-wrap gap-1">
                        {result.job.skills.slice(0, 8).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {result.job.skills.length > 8 && (
                          <Badge variant="outline" className="text-xs">
                            +{result.job.skills.length - 8} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Job Description Preview */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {result.job.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => onJobClick?.(result.job.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => onSaveJob?.(result.job.id)}
                        className="flex items-center gap-1"
                      >
                        <Heart className="h-4 w-4" />
                        Save Job
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {result.job.applicationCount} applications
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {results.length >= 20 && (
        <div className="text-center">
          <Button variant="outline" size="lg">
            Load More Results
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
