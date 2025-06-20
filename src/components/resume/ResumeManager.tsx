'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  Download,
  Edit,
  Trash2,
  Eye,
  Star,
  AlertCircle,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react';

interface Resume {
  id: string;
  filename: string;
  url: string;
  uploadedAt: string;
  isDefault: boolean;
  parsedData?: {
    name?: string;
    email?: string;
    phone?: string;
    summary?: string;
    experience?: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education?: Array<{
      degree: string;
      school: string;
      year: string;
    }>;
    skills?: string[];
  };
  aiSuggestions?: {
    score: number;
    improvements: string[];
    strengths: string[];
  };
}

interface ResumeManagerProps {
  userId: string;
}

export default function ResumeManager({ userId }: ResumeManagerProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile/resumes');
      if (response.ok) {
        const data = await response.json();
        setResumes(data.resumes || []);
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
      setError('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/profile/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload resume');
      }

      const data = await response.json();
      setResumes(prev => [data.resume, ...prev]);
      
      // Auto-analyze the uploaded resume
      if (data.resume.id) {
        analyzeResume(data.resume.id);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload resume');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const analyzeResume = async (resumeId: string) => {
    setAnalyzing(resumeId);
    try {
      const response = await fetch(`/api/profile/resumes/${resumeId}/analyze`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setResumes(prev => prev.map(resume => 
          resume.id === resumeId 
            ? { ...resume, parsedData: data.parsedData, aiSuggestions: data.aiSuggestions }
            : resume
        ));
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(null);
    }
  };

  const setDefaultResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/profile/resumes/${resumeId}/default`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setResumes(prev => prev.map(resume => ({
          ...resume,
          isDefault: resume.id === resumeId,
        })));
      }
    } catch (error) {
      console.error('Failed to set default resume:', error);
    }
  };

  const deleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      const response = await fetch(`/api/profile/resumes/${resumeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setResumes(prev => prev.filter(resume => resume.id !== resumeId));
      }
    } catch (error) {
      console.error('Failed to delete resume:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-lg p-6">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resume Manager</h2>
          <p className="text-gray-600 mt-1">Upload, manage, and optimize your resumes</p>
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {uploading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {resumes.length === 0 && !loading && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 cursor-pointer transition-colors"
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload your first resume</h3>
          <p className="text-gray-600 mb-4">
            Drag and drop your resume here, or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supports PDF, DOC, and DOCX files up to 5MB
          </p>
        </div>
      )}

      {/* Resume List */}
      {resumes.length > 0 && (
        <div className="space-y-4">
          {resumes.map((resume) => (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">{resume.filename}</h3>
                      {resume.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                    </p>

                    {/* AI Analysis Results */}
                    {resume.aiSuggestions && (
                      <div className="mt-3">
                        <div className="flex items-center space-x-4">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(resume.aiSuggestions.score)} ${getScoreColor(resume.aiSuggestions.score)}`}>
                            <Sparkles className="h-3 w-3 mr-1" />
                            Score: {resume.aiSuggestions.score}/100
                          </div>
                        </div>
                        
                        {resume.aiSuggestions.improvements.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">Suggestions:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {resume.aiSuggestions.improvements.slice(0, 2).map((improvement, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-orange-500 mr-1">•</span>
                                  {improvement}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {analyzing === resume.id ? (
                    <div className="flex items-center text-blue-600">
                      <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                      <span className="text-xs">Analyzing...</span>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => analyzeResume(resume.id)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Analyze with AI"
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                      
                      <a
                        href={resume.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                        title="View resume"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      
                      <a
                        href={resume.url}
                        download={resume.filename}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Download resume"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      
                      {!resume.isDefault && (
                        <button
                          onClick={() => setDefaultResume(resume.id)}
                          className="p-2 text-gray-600 hover:text-yellow-600 transition-colors"
                          title="Set as default"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteResume(resume.id)}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete resume"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Resume Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Upload multiple versions tailored for different job types</li>
          <li>• Use our AI analysis to get personalized improvement suggestions</li>
          <li>• Set your best resume as default for quick applications</li>
          <li>• Keep your resumes updated with your latest experience</li>
        </ul>
      </div>
    </div>
  );
}
