'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from 'lucide-react';

interface OptimizationSuggestion {
  id: string;
  type: 'title' | 'description' | 'requirements' | 'salary' | 'benefits' | 'location' | 'urgency';
  priority: 'high' | 'medium' | 'low';
  category: 'visibility' | 'applications' | 'quality' | 'conversion';
  title: string;
  description: string;
  currentValue?: string;
  suggestedValue?: string;
  impact: {
    metric: string;
    expectedChange: string;
    confidence: number;
  };
  reasoning: string;
  examples?: string[];
  implemented?: boolean;
}

interface JobOptimizationProps {
  jobId: string;
  jobData?: any;
  onOptimizationApplied?: (suggestion: OptimizationSuggestion) => void;
}

export function JobOptimizationSuggestions({ jobId, jobData, onOptimizationApplied }: JobOptimizationProps) {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<OptimizationSuggestion | null>(null);
  const [implementingIds, setImplementingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (jobId) {
      fetchOptimizationSuggestions();
    }
  }, [jobId]);

  const fetchOptimizationSuggestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/ai/job-optimization/${jobId}`);
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } else {
        // Mock suggestions for demonstration
        setSuggestions([
          {
            id: '1',
            type: 'title',
            priority: 'high',
            category: 'visibility',
            title: 'Optimize Job Title for Better Search Visibility',
            description: 'Your current job title could be more specific to attract qualified candidates.',
            currentValue: 'Developer Position',
            suggestedValue: 'Senior Full-Stack Developer - React & Node.js',
            impact: {
              metric: 'Search Visibility',
              expectedChange: '+35% more views',
              confidence: 85
            },
            reasoning: 'Specific titles with technology keywords perform 35% better in search results. Adding seniority level and tech stack helps candidates self-select.',
            examples: ['Senior Full-Stack Developer - React & Node.js', 'Frontend Developer - React/TypeScript', 'Backend Engineer - Python/Django']
          },
          {
            id: '2',
            type: 'salary',
            priority: 'high',
            category: 'applications',
            title: 'Add Competitive Salary Range',
            description: 'Jobs with salary ranges receive 3x more applications than those without.',
            currentValue: 'Competitive salary',
            suggestedValue: '$80,000 - $120,000 annually',
            impact: {
              metric: 'Application Rate',
              expectedChange: '+200% more applications',
              confidence: 92
            },
            reasoning: 'Based on market data for similar roles in your area, this salary range is competitive and will attract quality candidates while filtering out those with mismatched expectations.'
          },
          {
            id: '3',
            type: 'description',
            priority: 'medium',
            category: 'quality',
            title: 'Improve Job Description Structure',
            description: 'Your job description could be more scannable and engaging.',
            currentValue: 'Long paragraph format',
            suggestedValue: 'Bullet points with clear sections',
            impact: {
              metric: 'Read Completion',
              expectedChange: '+45% more complete reads',
              confidence: 78
            },
            reasoning: 'Structured descriptions with bullet points and clear sections are easier to scan and lead to higher engagement rates.',
            examples: ['Use bullet points for responsibilities', 'Add "What You\'ll Do" section', 'Include "What We Offer" section']
          },
          {
            id: '4',
            type: 'requirements',
            priority: 'medium',
            category: 'applications',
            title: 'Reduce Barrier to Entry',
            description: 'Your requirements list might be too restrictive and discouraging qualified candidates.',
            currentValue: '5+ years experience required',
            suggestedValue: '3+ years experience preferred',
            impact: {
              metric: 'Application Volume',
              expectedChange: '+60% more applications',
              confidence: 71
            },
            reasoning: 'Studies show that women and underrepresented groups are less likely to apply when they don\'t meet 100% of requirements. Using "preferred" instead of "required" increases diversity.'
          },
          {
            id: '5',
            type: 'benefits',
            priority: 'low',
            category: 'conversion',
            title: 'Highlight Remote Work Options',
            description: 'Remote work flexibility is a top priority for 73% of job seekers.',
            currentValue: 'Office-based position',
            suggestedValue: 'Hybrid remote (2-3 days in office)',
            impact: {
              metric: 'Application Quality',
              expectedChange: '+25% higher quality applications',
              confidence: 68
            },
            reasoning: 'Even partial remote work options significantly increase candidate interest and can help you compete with fully remote positions.'
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching optimization suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewSuggestions = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/ai/job-optimization/${jobId}/generate`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchOptimizationSuggestions();
      }
    } catch (error) {
      console.error('Error generating new suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const implementSuggestion = async (suggestion: OptimizationSuggestion) => {
    setImplementingIds(prev => new Set(prev).add(suggestion.id));
    
    try {
      const response = await fetch(`/api/ai/job-optimization/${jobId}/implement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId: suggestion.id })
      });

      if (response.ok) {
        setSuggestions(prev => 
          prev.map(s => 
            s.id === suggestion.id 
              ? { ...s, implemented: true }
              : s
          )
        );
        
        if (onOptimizationApplied) {
          onOptimizationApplied(suggestion);
        }
      } else {
        alert('Failed to implement suggestion');
      }
    } catch (error) {
      console.error('Error implementing suggestion:', error);
      alert('Failed to implement suggestion');
    } finally {
      setImplementingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.id);
        return newSet;
      });
    }
  };

  const dismissSuggestion = async (suggestionId: string) => {
    try {
      await fetch(`/api/ai/job-optimization/${jobId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId })
      });

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'visibility': return <BarChart3 className="h-4 w-4" />;
      case 'applications': return <Users className="h-4 w-4" />;
      case 'quality': return <Star className="h-4 w-4" />;
      case 'conversion': return <Target className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Job Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            AI Job Optimization
            <Badge variant="outline" className="ml-2">
              {suggestions.filter(s => !s.implemented).length} suggestions
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateNewSuggestions}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Analyzing...' : 'Refresh Suggestions'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No optimization suggestions available</p>
            <p className="text-sm">Your job posting looks great!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.filter(s => !s.implemented).map((suggestion) => (
              <div
                key={suggestion.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(suggestion.category)}
                    <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                    <Badge className={getPriorityColor(suggestion.priority)}>
                      {suggestion.priority} priority
                    </Badge>
                  </div>
                  <button
                    onClick={() => dismissSuggestion(suggestion.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-gray-600 mb-3">{suggestion.description}</p>

                {suggestion.currentValue && suggestion.suggestedValue && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current</span>
                        <p className="text-sm text-gray-700 mt-1">{suggestion.currentValue}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Suggested</span>
                        <p className="text-sm text-gray-900 mt-1 font-medium">{suggestion.suggestedValue}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">
                        {suggestion.impact.expectedChange}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">
                        {suggestion.impact.confidence}% confidence
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSuggestion(suggestion)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => implementSuggestion(suggestion)}
                      disabled={implementingIds.has(suggestion.id)}
                      className="bg-[#ff6b35] hover:bg-[#e55a2b]"
                    >
                      {implementingIds.has(suggestion.id) ? (
                        'Applying...'
                      ) : (
                        <>
                          Apply
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Implemented Suggestions */}
            {suggestions.some(s => s.implemented) && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Implemented Suggestions
                </h4>
                <div className="space-y-2">
                  {suggestions.filter(s => s.implemented).map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">{suggestion.title}</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Applied</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed View Modal */}
        {selectedSuggestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{selectedSuggestion.title}</h3>
                  <button
                    onClick={() => setSelectedSuggestion(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Why This Matters</h4>
                    <p className="text-gray-600">{selectedSuggestion.reasoning}</p>
                  </div>

                  {selectedSuggestion.examples && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Examples</h4>
                      <ul className="space-y-1">
                        {selectedSuggestion.examples.map((example, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setSelectedSuggestion(null)}>
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        implementSuggestion(selectedSuggestion);
                        setSelectedSuggestion(null);
                      }}
                      disabled={implementingIds.has(selectedSuggestion.id)}
                      className="bg-[#ff6b35] hover:bg-[#e55a2b]"
                    >
                      Apply Suggestion
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
