'use client';

import { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Sparkles,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  DollarSign,
  MapPin,
  Clock,
  Building,
  Users,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface ProcessedJob {
  id: number;
  title: string;
  company?: string;
  location: string;
  jobType?: string;
  salary?: string;
  description?: string;
  status: 'success' | 'warning' | 'error';
  warning?: string;
  error?: string;
  creditsRequired: number;
  optimized?: boolean;
}

interface UploadHistory {
  id: string;
  fileName: string;
  uploadDate: string;
  totalJobs: number;
  successfulJobs: number;
  creditsUsed: number;
  status: 'completed' | 'processing' | 'failed';
}

export default function EmployerBulkUploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  >('idle');
  const [processedJobs, setProcessedJobs] = useState<ProcessedJob[]>([]);
  const [showOptimization, setShowOptimization] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([
    {
      id: '1',
      fileName: 'tech_jobs_batch_1.csv',
      uploadDate: '2024-01-15',
      totalJobs: 25,
      successfulJobs: 23,
      creditsUsed: 23,
      status: 'completed',
    },
    {
      id: '2',
      fileName: 'sales_positions.xlsx',
      uploadDate: '2024-01-10',
      totalJobs: 15,
      successfulJobs: 15,
      creditsUsed: 15,
      status: 'completed',
    },
  ]);
  const [userCredits, setUserCredits] = useState({
    jobPost: 12,
    featuredPost: 3,
    socialGraphic: 5,
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setUploadedFile(file);
    setUploadStatus('uploading');

    try {
      // Parse CSV/Excel file (simplified for demo)
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('File must contain at least a header row and one job');
      }

      // Mock parsing - in real implementation, use a proper CSV parser
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const jobs = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        return {
          id: index + 1,
          title: values[headers.indexOf('title')] || `Job ${index + 1}`,
          company: values[headers.indexOf('company')] || 'Company Name',
          location: values[headers.indexOf('location')] || 'Location',
          jobType: values[headers.indexOf('jobtype')] || 'Full-time',
          salary: values[headers.indexOf('salary')] || '',
          description: values[headers.indexOf('description')] || '',
        };
      });

      setUploadStatus('processing');

      // Simulate API call to process jobs
      setTimeout(() => {
        const processedJobs = jobs.map(job => ({
          ...job,
          status: job.description.length > 10 ? 'success' : job.description.length > 0 ? 'warning' : 'error',
          warning: job.description.length <= 10 && job.description.length > 0 ? 'Short description - consider expanding' : undefined,
          error: job.description.length === 0 ? 'Missing required field: job description' : undefined,
          creditsRequired: job.description.length > 0 ? 1 : 0,
          optimized: job.description.length > 50,
        }));

        setProcessedJobs(processedJobs);
        setUploadStatus('complete');
      }, 2000);
    } catch (error) {
      console.error('File processing error:', error);
      setUploadStatus('error');
    }
  };

  const handleBulkPublish = async () => {
    if (!processedJobs.length) return;

    const successfulJobs = processedJobs.filter(job => job.status === 'success');
    const totalCreditsNeeded = successfulJobs.reduce((sum, job) => sum + job.creditsRequired, 0);

    if (totalCreditsNeeded > userCredits.jobPost) {
      alert(`Insufficient credits. You need ${totalCreditsNeeded} credits but only have ${userCredits.jobPost}.`);
      return;
    }

    try {
      const response = await fetch('/api/employers/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobs: successfulJobs.map(job => ({
            title: job.title,
            company: job.company,
            location: job.location,
            jobType: job.jobType?.toLowerCase().replace(' ', '_'),
            description: job.description,
            salary: job.salary,
            optimizationLevel: showOptimization ? 'enhanced' : 'standard',
          })),
          optimizationSettings: {
            autoEnhance: true,
            addKeywords: true,
            generateGraphics: false,
            createFeatured: false,
            optimizationLevel: 'standard',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish jobs');
      }

      const result = await response.json();

      // Update user credits
      setUserCredits(prev => ({
        ...prev,
        jobPost: prev.jobPost - totalCreditsNeeded,
      }));

      alert(`Successfully published ${result.totalJobs} jobs! ${totalCreditsNeeded} credits used.`);

      // Reset the form
      setProcessedJobs([]);
      setUploadedFile(null);
      setUploadStatus('idle');
    } catch (error) {
      console.error('Bulk publish error:', error);
      alert('Failed to publish jobs. Please try again.');
    }
  };

  const downloadTemplate = () => {
    const csvContent = `title,company,location,jobType,salary,description,requirements,benefits
"Senior Software Engineer","Tech Solutions Inc.","Stockton, CA","Full-time","$85,000 - $110,000","We are looking for a senior software engineer to join our growing team. You will be responsible for developing and maintaining our web applications using modern technologies.","5+ years of experience with JavaScript, React, Node.js. Bachelor's degree in Computer Science or related field.","Health insurance, 401k, flexible work schedule, remote work options"
"Marketing Manager","Central Valley Marketing","Modesto, CA","Full-time","$65,000 - $80,000","Join our dynamic marketing team as a Marketing Manager. You will lead marketing campaigns and strategies to grow our client base in the Central Valley.","3+ years of marketing experience, knowledge of digital marketing tools, excellent communication skills.","Health insurance, paid time off, professional development budget"
"Sales Representative","Valley Sales Corp","Tracy, CA","Full-time","$45,000 - $60,000 + Commission","We are seeking an energetic sales representative to join our team. You will be responsible for building relationships with clients and driving sales growth.","Previous sales experience preferred, strong communication skills, self-motivated.","Base salary plus commission, health benefits, company car allowance"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '209works_bulk_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Bulk Job Upload
          </h1>
          <p className="text-gray-600">
            Upload multiple job postings at once with AI optimization. Save time
            and ensure quality with our intelligent processing.
          </p>
        </div>

        {/* Credits Summary */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Your Credits</h2>
              <p className="text-sm text-gray-600">
                Each job posting uses 1 credit. Optimization and featured posts may require additional credits.
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-orange-500" />
                  <span className="text-2xl font-bold text-gray-900">{userCredits.jobPost}</span>
                </div>
                <p className="text-sm text-gray-600">Job Credits</p>
              </div>
              <div className="text-center">
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-purple-500" />
                  <span className="text-2xl font-bold text-gray-900">{userCredits.featuredPost}</span>
                </div>
                <p className="text-sm text-gray-600">Featured</p>
              </div>
              <button className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700">
                <CreditCard className="mr-2 inline h-4 w-4" />
                Add Credits
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <button
            onClick={downloadTemplate}
            className="rounded-xl bg-[#ff6b35] p-6 text-white transition-colors hover:bg-[#e55a2b]"
          >
            <Download className="mb-3 h-8 w-8" />
            <h3 className="mb-2 font-semibold">Download Template</h3>
            <p className="text-sm opacity-90">
              Get our CSV template with all required fields
            </p>
          </button>

          <Link
            href="/employers/post-job"
            className="block rounded-xl bg-[#2d4a3e] p-6 text-white transition-colors hover:bg-[#1d3a2e]"
          >
            <Sparkles className="mb-3 h-8 w-8 text-[#9fdf9f]" />
            <h3 className="mb-2 font-semibold">AI Job Optimizer</h3>
            <p className="text-sm opacity-90">
              Create optimized job posts one at a time
            </p>
          </Link>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="rounded-xl border-2 border-gray-200 bg-white p-6 transition-colors hover:border-[#2d4a3e]"
          >
            <FileText className="mb-3 h-8 w-8 text-[#2d4a3e]" />
            <h3 className="mb-2 font-semibold text-gray-900">Upload History</h3>
            <p className="text-sm text-gray-600">View previous bulk uploads</p>
          </button>

          <button
            onClick={() => setShowOptimization(!showOptimization)}
            className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6 transition-colors hover:border-blue-300"
          >
            <Sparkles className="mb-3 h-8 w-8 text-blue-600" />
            <h3 className="mb-2 font-semibold text-gray-900">Optimization Settings</h3>
            <p className="text-sm text-gray-600">Configure AI optimization options</p>
          </button>
        </div>

        {/* Upload Zone */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Upload Your Jobs
          </h2>

          <div
            className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
              dragActive
                ? 'border-[#2d4a3e] bg-[#9fdf9f]/10'
                : 'border-gray-300 hover:border-[#2d4a3e]'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {uploadStatus === 'idle' && (
              <>
                <Upload className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Drag and drop your file here
                </h3>
                <p className="mb-6 text-gray-600">
                  Support for CSV, Excel (.xlsx), and JSON files up to 10MB
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.json"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer rounded-lg bg-[#ff6b35] px-6 py-3 font-medium text-white transition-colors hover:bg-[#e55a2b]"
                >
                  Choose File
                </label>
              </>
            )}

            {uploadStatus === 'uploading' && (
              <div className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-[#ff6b35]"></div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Uploading...
                </h3>
                <p className="text-gray-600">Processing your file</p>
              </div>
            )}

            {uploadStatus === 'processing' && (
              <div className="text-center">
                <Sparkles className="mx-auto mb-4 h-16 w-16 text-[#2d4a3e]" />
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  AI Processing...
                </h3>
                <p className="text-gray-600">
                  Optimizing job descriptions and validating data
                </p>
              </div>
            )}

            {uploadStatus === 'complete' && (
              <div className="text-center">
                <CheckCircle className="mx-auto mb-4 h-16 w-16 text-[#9fdf9f]" />
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Upload Complete!
                </h3>
                <p className="text-gray-600">
                  Your jobs have been processed and are ready for review
                </p>
              </div>
            )}
          </div>

          {uploadedFile && (
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="mr-3 h-5 w-5 text-[#2d4a3e]" />
                  <span className="font-medium text-gray-900">
                    {uploadedFile.name}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({(uploadedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                {uploadStatus === 'complete' && (
                  <CheckCircle className="h-5 w-5 text-[#9fdf9f]" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Processing Results */}
        {uploadStatus === 'complete' && processedJobs.length > 0 && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Processing Results
                </h2>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                  <span>
                    {processedJobs.filter(job => job.status === 'success').length} successful
                  </span>
                  <span>
                    {processedJobs.filter(job => job.status === 'warning').length} warnings
                  </span>
                  <span>
                    {processedJobs.filter(job => job.status === 'error').length} errors
                  </span>
                  <span className="font-medium text-blue-600">
                    Credits needed: {processedJobs.reduce((sum, job) => sum + job.creditsRequired, 0)}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleBulkPublish}
                  disabled={processedJobs.reduce((sum, job) => sum + job.creditsRequired, 0) > userCredits.jobPost}
                  className="rounded-lg bg-[#2d4a3e] px-4 py-2 font-medium text-white transition-colors hover:bg-[#1d3a2e] disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Publish All ({processedJobs.reduce((sum, job) => sum + job.creditsRequired, 0)} credits)
                </button>
                <button className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:border-[#2d4a3e]">
                  Save as Draft
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {processedJobs.map(job => (
                <div
                  key={job.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {job.status === 'success' && (
                        <CheckCircle className="mr-3 h-5 w-5 text-[#9fdf9f]" />
                      )}
                      {job.status === 'warning' && (
                        <AlertCircle className="mr-3 h-5 w-5 text-[#ff6b35]" />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600">{job.location}</p>
                        {job.warning && (
                          <p className="mt-1 text-sm text-[#ff6b35]">
                            ⚠️ {job.warning}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-sm font-medium text-[#2d4a3e] hover:text-[#1d3a2e]">
                        Edit
                      </button>
                      <button className="text-sm font-medium text-[#ff6b35] hover:text-[#e55a2b]">
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload History */}
        {showHistory && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Upload History</h2>
            <div className="space-y-4">
              {uploadHistory.map((upload) => (
                <div key={upload.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{upload.fileName}</h3>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                        <span>Uploaded: {upload.uploadDate}</span>
                        <span>{upload.successfulJobs}/{upload.totalJobs} jobs posted</span>
                        <span>{upload.creditsUsed} credits used</span>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          upload.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : upload.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {upload.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        View Details
                      </button>
                      <button className="text-sm font-medium text-gray-600 hover:text-gray-700">
                        Download Report
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optimization Settings */}
        {showOptimization && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">AI Optimization Settings</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Optimization Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3 rounded" defaultChecked />
                    <span className="text-sm text-gray-700">Auto-enhance job descriptions</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3 rounded" defaultChecked />
                    <span className="text-sm text-gray-700">Add relevant keywords for SEO</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3 rounded" />
                    <span className="text-sm text-gray-700">Generate social media graphics (+1 credit each)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3 rounded" />
                    <span className="text-sm text-gray-700">Create featured listings (+2 credits each)</span>
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Quality Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Optimization Level
                    </label>
                    <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
                      <option>Standard (included)</option>
                      <option>Enhanced (+0.5 credits each)</option>
                      <option>Premium (+1 credit each)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Audience
                    </label>
                    <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
                      <option>General 209 Area</option>
                      <option>Tech Professionals</option>
                      <option>Healthcare Workers</option>
                      <option>Retail & Service</option>
                      <option>Manufacturing</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <Sparkles className="mb-4 h-8 w-8 text-[#2d4a3e]" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              AI Optimization
            </h3>
            <p className="text-sm text-gray-600">
              Automatically enhance job descriptions for better candidate
              attraction and ATS compatibility.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <CheckCircle className="mb-4 h-8 w-8 text-[#9fdf9f]" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Smart Validation
            </h3>
            <p className="text-sm text-gray-600">
              Real-time validation ensures all required fields are complete and
              properly formatted.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <Upload className="mb-4 h-8 w-8 text-[#ff6b35]" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Batch Processing
            </h3>
            <p className="text-sm text-gray-600">
              Upload hundreds of jobs at once with intelligent processing and
              error handling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
