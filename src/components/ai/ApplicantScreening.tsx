'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Target,
  Star,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  User,
  FileText,
  Award,
  MapPin,
  Clock,
  Briefcase,
  GraduationCap,
  Zap,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  BarChart3,
  Filter,
  SortAsc,
  RefreshCw,
} from 'lucide-react';

interface ApplicantScore {
  overall: number;
  skillsMatch: number;
  experienceMatch: number;
  locationFit: number;
  culturalFit: number;
  salaryExpectations: number;
}

interface ScreeningInsight {
  type: 'strength' | 'concern' | 'neutral';
  category: 'skills' | 'experience' | 'education' | 'location' | 'culture' | 'communication';
  title: string;
  description: string;
  confidence: number;
  evidence?: string[];
}

interface ApplicantScreeningData {
  applicantId: string;
  applicantName: string;
  jobTitle: string;
  appliedAt: string;
  scores: ApplicantScore;
  insights: ScreeningInsight[];
  recommendation: 'strong_match' | 'good_match' | 'potential_match' | 'poor_match';
  keyStrengths: string[];
  keyWeaknesses: string[];
  interviewQuestions: string[];
  nextSteps: string[];
  resumeAnalysis: {
    keySkills: string[];
    experienceYears: number;
    educationLevel: string;
    careerProgression: 'ascending' | 'stable' | 'declining';
    gapAnalysis: string[];
  };
}

interface ApplicantScreeningProps {
  jobId: string;
  applicantId?: string;
  onScreeningComplete?: (data: ApplicantScreeningData) => void;
}

export function ApplicantScreening({ jobId, applicantId, onScreeningComplete }: ApplicantScreeningProps) {
  const [screeningData, setScreeningData] = useState<ApplicantScreeningData[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantScreeningData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScreening, setIsScreening] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'name'>('score');
  const [filterBy, setFilterBy] = useState<'all' | 'strong_match' | 'good_match' | 'potential_match'>('all');

  useEffect(() => {
    if (jobId) {
      fetchScreeningData();
    }
  }, [jobId]);

  const fetchScreeningData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/ai/applicant-screening/${jobId}`);
      
      if (response.ok) {
        const data = await response.json();
        setScreeningData(data.screenings || []);
      } else {
        // Mock data for demonstration
        setScreeningData([
          {
            applicantId: '1',
            applicantName: 'Sarah Johnson',
            jobTitle: 'Senior Frontend Developer',
            appliedAt: '2024-01-15T10:30:00Z',
            scores: {
              overall: 92,
              skillsMatch: 95,
              experienceMatch: 88,
              locationFit: 100,
              culturalFit: 85,
              salaryExpectations: 90,
            },
            insights: [
              {
                type: 'strength',
                category: 'skills',
                title: 'Excellent React Expertise',
                description: 'Demonstrates advanced React skills with 5+ years of experience and contributions to open source projects.',
                confidence: 95,
                evidence: ['5 years React experience', 'Open source contributions', 'Advanced patterns knowledge'],
              },
              {
                type: 'strength',
                category: 'experience',
                title: 'Strong Leadership Background',
                description: 'Has led multiple teams and projects, showing progression from developer to senior roles.',
                confidence: 88,
                evidence: ['Led team of 6 developers', 'Managed 3 major projects', 'Mentored junior developers'],
              },
              {
                type: 'concern',
                category: 'experience',
                title: 'Limited Backend Experience',
                description: 'Primarily frontend focused with minimal backend development experience.',
                confidence: 75,
                evidence: ['No Node.js experience mentioned', 'Limited API development', 'Frontend-only projects'],
              },
            ],
            recommendation: 'strong_match',
            keyStrengths: ['React expertise', 'Leadership experience', 'Local candidate', 'Strong portfolio'],
            keyWeaknesses: ['Limited backend skills', 'No Node.js experience'],
            interviewQuestions: [
              'Can you walk me through your experience leading a development team?',
              'How do you approach state management in large React applications?',
              'Tell me about a challenging technical problem you solved recently.',
            ],
            nextSteps: ['Schedule technical interview', 'Review portfolio projects', 'Check references'],
            resumeAnalysis: {
              keySkills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'Git', 'Agile'],
              experienceYears: 6,
              educationLevel: 'Bachelor\'s Degree',
              careerProgression: 'ascending',
              gapAnalysis: ['Backend development', 'DevOps experience'],
            },
          },
          {
            applicantId: '2',
            applicantName: 'Michael Chen',
            jobTitle: 'Senior Frontend Developer',
            appliedAt: '2024-01-14T14:20:00Z',
            scores: {
              overall: 78,
              skillsMatch: 82,
              experienceMatch: 75,
              locationFit: 60,
              culturalFit: 90,
              salaryExpectations: 85,
            },
            insights: [
              {
                type: 'strength',
                category: 'skills',
                title: 'Full-Stack Capabilities',
                description: 'Strong both frontend and backend skills with modern tech stack experience.',
                confidence: 85,
                evidence: ['React + Node.js experience', 'Database design', 'API development'],
              },
              {
                type: 'concern',
                category: 'location',
                title: 'Remote Location',
                description: 'Currently based in another state, may require relocation or remote work arrangement.',
                confidence: 80,
                evidence: ['Based in Austin, TX', 'No local address', 'Remote work preference'],
              },
            ],
            recommendation: 'good_match',
            keyStrengths: ['Full-stack skills', 'Modern tech stack', 'Strong problem-solving'],
            keyWeaknesses: ['Location distance', 'Less leadership experience'],
            interviewQuestions: [
              'Are you open to relocating or working remotely?',
              'Describe your experience with full-stack development.',
              'How do you handle working across different time zones?',
            ],
            nextSteps: ['Discuss remote work options', 'Technical assessment', 'Cultural fit interview'],
            resumeAnalysis: {
              keySkills: ['React', 'Node.js', 'MongoDB', 'AWS', 'Docker', 'TypeScript'],
              experienceYears: 4,
              educationLevel: 'Master\'s Degree',
              careerProgression: 'ascending',
              gapAnalysis: ['Team leadership', 'Local market knowledge'],
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching screening data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runAIScreening = async (applicantId: string) => {
    setIsScreening(true);
    try {
      const response = await fetch(`/api/ai/applicant-screening/${jobId}/screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId }),
      });

      if (response.ok) {
        const newScreening = await response.json();
        setScreeningData(prev => [...prev, newScreening]);
        if (onScreeningComplete) {
          onScreeningComplete(newScreening);
        }
      }
    } catch (error) {
      console.error('Error running AI screening:', error);
    } finally {
      setIsScreening(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_match': return 'bg-green-100 text-green-800';
      case 'good_match': return 'bg-blue-100 text-blue-800';
      case 'potential_match': return 'bg-yellow-100 text-yellow-800';
      case 'poor_match': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'concern': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <MessageSquare className="h-4 w-4 text-blue-600" />;
    }
  };

  const filteredAndSortedData = screeningData
    .filter(data => filterBy === 'all' || data.recommendation === filterBy)
    .sort((a, b) => {
      switch (sortBy) {
        case 'score': return b.scores.overall - a.scores.overall;
        case 'date': return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
        case 'name': return a.applicantName.localeCompare(b.applicantName);
        default: return 0;
      }
    });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Applicant Screening
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
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Applicant Screening
              <Badge variant="outline" className="ml-2">
                {screeningData.length} screened
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Candidates</option>
                <option value="strong_match">Strong Matches</option>
                <option value="good_match">Good Matches</option>
                <option value="potential_match">Potential Matches</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="score">Sort by Score</option>
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
              </select>
              <Button variant="outline" size="sm" onClick={fetchScreeningData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No applicants screened yet</p>
              <p className="text-sm">AI screening will appear here once applicants are processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedData.map((data) => (
                <div
                  key={data.applicantId}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedApplicant(data)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{data.applicantName}</h4>
                        <p className="text-sm text-gray-600">Applied {new Date(data.appliedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{data.scores.overall}</div>
                        <div className="text-xs text-gray-500">Overall Score</div>
                      </div>
                      <Badge className={getRecommendationColor(data.recommendation)}>
                        {data.recommendation.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{data.scores.skillsMatch}</div>
                      <div className="text-xs text-gray-500">Skills</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{data.scores.experienceMatch}</div>
                      <div className="text-xs text-gray-500">Experience</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{data.scores.locationFit}</div>
                      <div className="text-xs text-gray-500">Location</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{data.scores.culturalFit}</div>
                      <div className="text-xs text-gray-500">Culture</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{data.scores.salaryExpectations}</div>
                      <div className="text-xs text-gray-500">Salary</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {data.keyStrengths.slice(0, 3).map((strength, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed View Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{selectedApplicant.applicantName}</h2>
                  <p className="text-gray-600">AI Screening Results</p>
                </div>
                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scores */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Scoring Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(selectedApplicant.scores).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">{value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedApplicant.insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-2">
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">{insight.title}</h4>
                            <p className="text-xs text-gray-600">{insight.description}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              {insight.confidence}% confidence
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Interview Questions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Suggested Interview Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedApplicant.interviewQuestions.map((question, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-sm text-gray-500 mt-1">{index + 1}.</span>
                          <p className="text-sm text-gray-700">{question}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Next Steps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recommended Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedApplicant.nextSteps.map((step, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-700">{step}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedApplicant(null)}>
                  Close
                </Button>
                <Button className="bg-[#ff6b35] hover:bg-[#e55a2b]">
                  Schedule Interview
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
