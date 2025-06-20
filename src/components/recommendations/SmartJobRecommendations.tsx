'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Star, 
  MapPin, 
  DollarSign, 
  Clock, 
  Briefcase,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Sparkles,
  Eye,
  Heart,
  Share2,
  ExternalLink,
  ChevronRight,
  Zap,
  Award,
  Users
} from 'lucide-react';

interface JobRecommendation {
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
  };
  score: number;
  reasons: string[];
  matchType: 'skills' | 'experience' | 'location' | 'salary' | 'semantic';
  confidence: 'high' | 'medium' | 'low';
}

interface SmartJobRecommendationsProps {
  userId?: string;
  region?: string;
  limit?: number;
  onJobClick?: (jobId: string) => void;
  onFeedback?: (jobId: string, feedback: 'like' | 'dislike', reasons?: string[]) => void;
  className?: string;
}

export default function SmartJobRecommendations({
  userId,
  region,
  limit = 10,
  onJobClick,
  onFeedback,
  className = '',
}: SmartJobRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
    }
  }, [userId, region, limit]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (region) params.set('region', region);
      if (limit) params.set('limit', limit.toString());

      const response = await fetch(`/api/recommendations/jobs?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.data.recommendations);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (jobId: string, feedback: 'like' | 'dislike', reasons?: string[]) => {
    try {
      // Mark feedback as given immediately for UI responsiveness
      setFeedbackGiven(prev => new Set([...prev, jobId]));
      
      // Send feedback to API
      const response = await fetch('/api/recommendations/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: {
            jobId,
            type: feedback,
            reasons,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        // Call parent callback if provided
        onFeedback?.(jobId, feedback, reasons);
        
        // Optionally refresh recommendations after feedback
        // setTimeout(fetchRecommendations, 1000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Remove from feedback given set if failed
      setFeedbackGiven(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'skills': return <Star className="h-4 w-4" />;
      case 'experience': return <TrendingUp className="h-4 w-4" />;
      case 'location': return <MapPin className="h-4 w-4" />;
      case 'salary': return <DollarSign className="h-4 w-4" />;
      case 'semantic': return <Brain className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max?.toLocaleString()}`;
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (activeTab === 'all') return true;
    if (activeTab === 'high-match') return rec.confidence === 'high';
    if (activeTab === 'skills') return rec.matchType === 'skills';
    if (activeTab === 'semantic') return rec.matchType === 'semantic';
    return true;
  });

  if (!userId) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sign in for Personalized Recommendations
          </h3>
          <p className="text-gray-600 mb-4">
            Get AI-powered job recommendations tailored to your skills and preferences
          </p>
          <Button>Sign In</Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Job Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Target className="h-12 w-12 mx-auto mb-2" />
            <p>{error}</p>
          </div>
          <Button onClick={fetchRecommendations} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-green-600" />
              AI Job Recommendations
            </CardTitle>
            <CardDescription>
              Personalized job matches based on your profile and preferences
            </CardDescription>
          </div>
          
          <Button
            onClick={fetchRecommendations}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({recommendations.length})</TabsTrigger>
            <TabsTrigger value="high-match">
              High Match ({recommendations.filter(r => r.confidence === 'high').length})
            </TabsTrigger>
            <TabsTrigger value="skills">
              Skills ({recommendations.filter(r => r.matchType === 'skills').length})
            </TabsTrigger>
            <TabsTrigger value="semantic">
              AI Match ({recommendations.filter(r => r.matchType === 'semantic').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Recommendations List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredRecommendations.map((recommendation, index) => (
              <motion.div
                key={recommendation.job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 
                        className="font-semibold text-lg hover:text-green-600 cursor-pointer"
                        onClick={() => onJobClick?.(recommendation.job.id)}
                      >
                        {recommendation.job.title}
                      </h3>
                      {recommendation.job.featured && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {recommendation.job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {recommendation.job.location}
                        {recommendation.job.remote && ' (Remote)'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {recommendation.job.jobType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        {formatSalary(recommendation.job.salaryMin, recommendation.job.salaryMax)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {recommendation.job.experienceLevel}
                      </Badge>
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      {getMatchTypeIcon(recommendation.matchType)}
                      <span className="text-sm font-medium">
                        {Math.round(recommendation.score * 100)}% Match
                      </span>
                    </div>
                    <Badge className={`text-xs ${getConfidenceColor(recommendation.confidence)}`}>
                      {recommendation.confidence} confidence
                    </Badge>
                  </div>
                </div>

                {/* Match Reasons */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {recommendation.reasons.map((reason, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                {recommendation.job.skills.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {recommendation.job.skills.slice(0, 5).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {recommendation.job.skills.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{recommendation.job.skills.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => onJobClick?.(recommendation.job.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View Job
                    </Button>
                    
                    <Button size="sm" variant="outline">
                      <Heart className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>

                  {/* Feedback */}
                  {!feedbackGiven.has(recommendation.job.id) && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFeedback(recommendation.job.id, 'like')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFeedback(recommendation.job.id, 'dislike')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {feedbackGiven.has(recommendation.job.id) && (
                    <Badge variant="outline" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Feedback received
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredRecommendations.length === 0 && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No recommendations found
            </h3>
            <p className="text-gray-600 mb-4">
              Try updating your profile or adjusting your preferences
            </p>
            <Button onClick={fetchRecommendations} variant="outline">
              Refresh Recommendations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
