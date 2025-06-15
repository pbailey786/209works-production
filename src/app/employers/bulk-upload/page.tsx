'use client';

import { useState, useEffect } from 'react';
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
  MessageCircle,
  X,
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
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [userCredits, setUserCredits] = useState({
    universal: 0,
    total: 0, // Unified credit system
  });

  // New state for error handling and modals
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<ProcessedJob | null>(null);
  const [previewJob, setPreviewJob] = useState<ProcessedJob | null>(null);
  const [optimizationSettings, setOptimizationSettings] = useState({
    autoEnhance: true,
    addKeywords: true,
    generateGraphics: false,
    createFeatured: false,
    optimizationLevel: 'standard' as 'standard' | 'enhanced' | 'premium',
    targetAudience: 'general',
  });

  // New state for subscription and support
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);
  const [genieResponse, setGenieResponse] = useState<string | null>(null);
  const [askingGenie, setAskingGenie] = useState(false);
  const [showGenieFirst, setShowGenieFirst] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // Helper function to get total credits (unified system)
  const getTotalCredits = () => {
    return userCredits.total || userCredits.universal || 0;
  };

  // Fetch upload history and user credits on component mount
  useEffect(() => {
    fetchUploadHistory();
    fetchUserCredits();
    checkSubscriptionStatus();

    // Handle credit purchase success/cancel from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('credit_purchase_success') === 'true') {
      showSuccess('Credits purchased successfully! Your account has been updated.');
      // Refresh credits after successful purchase
      setTimeout(() => {
        fetchUserCredits();
      }, 1000);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('credit_purchase_cancelled') === 'true') {
      showError('Credit purchase was cancelled. You can try again anytime.');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchUploadHistory = async () => {
    try {
      const response = await fetch('/api/employers/bulk-upload');
      if (response.ok) {
        const data = await response.json();
        setUploadHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch upload history:', error);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/employers/credits');
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.credits || { universal: 0, total: 0 });
      } else {
        // If credits API fails, set zero credits
        setUserCredits({ universal: 0, total: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch user credits:', error);
      // Set zero credits if API fails
      setUserCredits({ universal: 0, total: 0 });
    }
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/employers/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setHasActiveSubscription(data.hasActiveSubscription || false);
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      setHasActiveSubscription(false);
    }
  };

  const handleAddCredits = async () => {
    // Check if user has active subscription
    if (!hasActiveSubscription) {
      showError('Credit purchases are only available to active subscribers. Please upgrade your subscription to purchase additional credits.');
      return;
    }

    try {
      // Redirect to proper Stripe checkout for credit purchase
      const response = await fetch('/api/job-posting/buy-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditPack: 'fiveCredits', // Default to 5 credits pack
          successUrl: `${window.location.origin}/employers/bulk-upload?credit_purchase_success=true`,
          cancelUrl: `${window.location.origin}/employers/bulk-upload?credit_purchase_cancelled=true`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout for payment processing
      window.location.href = data.url;
    } catch (error) {
      console.error('Credit purchase error:', error);
      showError(error instanceof Error ? error.message : 'Failed to initiate credit purchase. Please try again.');
    }
  };

  const handleGenieSupport = async () => {
    if (!supportMessage.trim()) {
      showError('Please enter a question before asking Genie.');
      return;
    }

    setAskingGenie(true);
    try {
      const response = await fetch('/api/support/genie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: supportMessage.trim(),
          context: {
            page: 'bulk-upload',
            userAgent: navigator.userAgent,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGenieResponse(data.reply);
        setShowGenieFirst(false);
      } else {
        throw new Error('Failed to get AI support response');
      }
    } catch (error) {
      console.error('Failed to get Genie support:', error);
      showError('AI support is temporarily unavailable. You can still contact human support below.');
      setShowGenieFirst(false);
    } finally {
      setAskingGenie(false);
    }
  };

  const handleSupportSubmit = async () => {
    if (!supportMessage.trim()) {
      showError('Please enter a message before sending.');
      return;
    }

    setSendingSupport(true);
    try {
      const response = await fetch('/api/support/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: supportMessage.trim(),
          page: 'bulk-upload',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        showSuccess('Your support message has been sent! Our team will get back to you within 24 hours.');
        setSupportMessage('');
        setShowSupportModal(false);
      } else {
        throw new Error('Failed to send support message');
      }
    } catch (error) {
      console.error('Failed to send support message:', error);
      showError('Failed to send support message. Please try again or contact support directly at support@209.works.');
    } finally {
      setSendingSupport(false);
    }
  };

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
    // Check if user has any credits before processing (unified credit system)
    if (getTotalCredits() === 0) {
      setShowUpgradeModal(true);
      return;
    }

    setUploadedFile(file);
    setUploadStatus('uploading');

    try {
      // Validate file type and size
      const allowedTypes = ['.csv', '.xlsx', '.json'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        throw new Error('Invalid file type. Please upload a CSV, Excel, or JSON file.');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size too large. Please upload a file smaller than 10MB.');
      }

      setUploadStatus('processing');

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('optimizationSettings', JSON.stringify(optimizationSettings));

      // Send file to API for processing
      const response = await fetch('/api/employers/bulk-upload/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process file');
      }

      const result = await response.json();

      if (result.success) {
        setProcessedJobs(result.processedJobs || []);
        setUploadStatus('complete');
        showSuccess(`Successfully processed ${result.processedJobs?.length || 0} jobs from your file.`);
      } else {
        throw new Error(result.error || 'Failed to process jobs');
      }
    } catch (error) {
      console.error('File processing error:', error);
      setUploadStatus('error');
      showError(error instanceof Error ? error.message : 'Failed to process file');
    }
  };

  const handleBulkPublish = async () => {
    if (!processedJobs.length) return;

    const successfulJobs = processedJobs.filter(job => job.status === 'success');
    const totalCreditsNeeded = successfulJobs.reduce((sum, job) => sum + job.creditsRequired, 0);
    const totalCredits = getTotalCredits();

    if (totalCreditsNeeded > totalCredits) {
      if (totalCredits === 0) {
        setShowUpgradeModal(true);
        return;
      }
      showError(`Insufficient credits. You need ${totalCreditsNeeded} credits but only have ${totalCredits}.`);
      return;
    }

    try {
      setUploadStatus('processing');

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
            optimizationLevel: optimizationSettings.optimizationLevel,
          })),
          optimizationSettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish jobs');
      }

      const result = await response.json();

      // Update user credits (unified system)
      setUserCredits(prev => ({
        universal: Math.max(0, prev.universal - totalCreditsNeeded),
        total: Math.max(0, prev.total - totalCreditsNeeded),
      }));

      showSuccess(`Successfully published ${result.createdJobs} out of ${result.totalJobs} jobs! ${totalCreditsNeeded} credits used.`);

      // Reset the form
      setProcessedJobs([]);
      setUploadedFile(null);
      setUploadStatus('idle');

      // Refresh upload history
      fetchUploadHistory();
    } catch (error) {
      console.error('Bulk publish error:', error);
      showError(error instanceof Error ? error.message : 'Failed to publish jobs. Please try again.');
      setUploadStatus('complete'); // Return to complete state so user can try again
    }
  };

  const handleEditJob = (job: ProcessedJob) => {
    setEditingJob(job);
  };

  const handlePreviewJob = (job: ProcessedJob) => {
    setPreviewJob(job);
  };

  const handleSaveEdit = (updatedJob: ProcessedJob) => {
    setProcessedJobs(prev =>
      prev.map(job => job.id === updatedJob.id ? updatedJob : job)
    );
    setEditingJob(null);
    showSuccess('Job updated successfully!');
  };

  const handleOptimizeJob = async (job: ProcessedJob) => {
    try {
      // Check if user has credits before optimizing (unified credit system)
      if (getTotalCredits() === 0) {
        showError('No credits available. Please purchase credits to optimize jobs.');
        return;
      }

      const response = await fetch('/api/job-post-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: job.title,
          companyName: job.company,
          location: job.location,
          pay: job.salary,
          schedule: job.jobType,
          companyDescription: '',
          idealFit: job.description,
          culture: '',
          growthPath: '',
          perks: '',
          applicationCTA: '',
          mediaUrls: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          showError(errorData.error || 'Job posting credits required to optimize jobs.');
          return;
        }
        throw new Error(errorData.error || 'Failed to optimize job');
      }

      const result = await response.json();

      if (result.success && result.aiGeneratedOutput) {
        const optimizedJob = {
          ...job,
          description: result.aiGeneratedOutput,
          optimized: true,
        };

        setProcessedJobs(prev =>
          prev.map(j => j.id === job.id ? optimizedJob : j)
        );

        // Update user credits since optimization used one (unified credit system)
        setUserCredits(prev => ({
          universal: Math.max(0, prev.universal - 1),
          total: Math.max(0, prev.total - 1),
        }));

        showSuccess('Job optimized successfully! 1 credit used.');
      }
    } catch (error) {
      console.error('Optimization error:', error);
      showError(error instanceof Error ? error.message : 'Failed to optimize job. Please try again.');
    }
  };

  const handleUpgrade = () => {
    // Redirect to pricing/subscription page
    window.location.href = '/employers/pricing';
  };

  const downloadTemplate = () => {
    const csvContent = `title,company,location,jobType,salary,description,requirements,benefits,experienceLevel,remote
"Senior Software Engineer","Tech Solutions Inc.","Stockton, CA","Full-time","$85,000 - $110,000","We are looking for a senior software engineer to join our growing team. You will be responsible for developing and maintaining our web applications using modern technologies.","5+ years of experience with JavaScript, React, Node.js. Bachelor's degree in Computer Science or related field.","Health insurance, 401k, flexible work schedule, remote work options","Senior","Yes"
"Marketing Manager","Central Valley Marketing","Modesto, CA","full_time","$65,000 - $80,000","Join our dynamic marketing team as a Marketing Manager. You will lead marketing campaigns and strategies to grow our client base in the Central Valley.","3+ years of marketing experience, knowledge of digital marketing tools, excellent communication skills.","Health insurance, paid time off, professional development budget","Mid-level","No"
"Sales Representative","Valley Sales Corp","Tracy, CA","part-time","$45,000 - $60,000 + Commission","We are seeking an energetic sales representative to join our team. You will be responsible for building relationships with clients and driving sales growth.","Previous sales experience preferred, strong communication skills, self-motivated.","Base salary plus commission, health benefits, company car allowance","Entry","false"
"Customer Service Rep","209 Support Services","Manteca, CA","contract","$18 - $22/hour","Provide excellent customer service support to our clients via phone, email, and chat. Handle inquiries, resolve issues, and maintain customer satisfaction.","High school diploma, excellent communication skills, customer service experience preferred.","Flexible schedule, training provided, growth opportunities","entry-level","remote"`;

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
      {/* Error Popup */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md rounded-lg bg-red-50 border border-red-200 p-4 shadow-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-2 text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md rounded-lg bg-green-50 border border-green-200 p-4 shadow-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-2 text-green-400 hover:text-green-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                Bulk Job Upload
              </h1>
              <p className="text-gray-600">
                Upload multiple job postings at once with AI optimization. Save time
                and ensure quality with our intelligent processing.
              </p>
            </div>
            <button
              onClick={() => setShowInstructionsModal(true)}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              How It Works
            </button>
          </div>
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
                  <span className="text-2xl font-bold text-gray-900">
                    {getTotalCredits()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Universal Credits</p>
              </div>
              <div className="text-center">
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Any Feature</span>
                </div>
                <p className="text-xs text-gray-500">Jobs, Featured, Social</p>
              </div>
              <button
                onClick={handleAddCredits}
                disabled={!hasActiveSubscription}
                className={`rounded-lg px-4 py-2 text-white transition-colors ${
                  hasActiveSubscription
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                title={!hasActiveSubscription ? 'Active subscription required to purchase credits' : 'Add more credits to your account'}
              >
                <CreditCard className="mr-2 inline h-4 w-4" />
                Add Credits {!hasActiveSubscription && '(Subscription Required)'}
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

          {getTotalCredits() === 0 && (
            <div className="mb-6 rounded-lg bg-orange-50 border border-orange-200 p-4">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-orange-600 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-orange-800">Credits Required</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Bulk upload requires credits.
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="underline font-medium ml-1 hover:text-orange-800"
                    >
                      Get credits
                    </button>
                    to start uploading multiple jobs at once.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div
            className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
              getTotalCredits() === 0
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                : dragActive
                ? 'border-[#2d4a3e] bg-[#9fdf9f]/10'
                : 'border-gray-300 hover:border-[#2d4a3e]'
            }`}
            onDragEnter={getTotalCredits() > 0 ? handleDrag : undefined}
            onDragLeave={getTotalCredits() > 0 ? handleDrag : undefined}
            onDragOver={getTotalCredits() > 0 ? handleDrag : undefined}
            onDrop={getTotalCredits() > 0 ? handleDrop : undefined}
          >
            {uploadStatus === 'idle' && (
              <>
                <Upload className={`mx-auto mb-4 h-16 w-16 ${getTotalCredits() === 0 ? 'text-gray-300' : 'text-gray-400'}`} />
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  {getTotalCredits() === 0 ? 'Credits Required for Upload' : 'Drag and drop your file here'}
                </h3>
                <p className="mb-6 text-gray-600">
                  {getTotalCredits() === 0
                    ? 'Purchase credits to start uploading jobs in bulk'
                    : 'Support for CSV, Excel (.xlsx), and JSON files up to 10MB'
                  }
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.json"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                  disabled={getTotalCredits() === 0}
                />
                <label
                  htmlFor={getTotalCredits() === 0 ? undefined : "file-upload"}
                  className={`rounded-lg px-6 py-3 font-medium text-white transition-colors ${
                    getTotalCredits() === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'cursor-pointer bg-[#ff6b35] hover:bg-[#e55a2b]'
                  }`}
                  onClick={getTotalCredits() === 0 ? () => setShowUpgradeModal(true) : undefined}
                >
                  {getTotalCredits() === 0 ? 'Get Credits' : 'Choose File'}
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

            {uploadStatus === 'error' && (
              <div className="text-center">
                <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Upload Failed
                </h3>
                <p className="text-gray-600 mb-4">
                  There was an error processing your file. Please check the format and try again.
                </p>
                <button
                  onClick={() => {
                    setUploadStatus('idle');
                    setUploadedFile(null);
                    setProcessedJobs([]);
                  }}
                  className="rounded-lg bg-[#ff6b35] px-6 py-3 font-medium text-white transition-colors hover:bg-[#e55a2b]"
                >
                  Try Again
                </button>
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
                  disabled={processedJobs.reduce((sum, job) => sum + job.creditsRequired, 0) > getTotalCredits()}
                  className="rounded-lg bg-[#2d4a3e] px-4 py-2 font-medium text-white transition-colors hover:bg-[#1d3a2e] disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Publish All ({processedJobs.reduce((sum, job) => sum + job.creditsRequired, 0)} credits)
                </button>
                <button
                  disabled
                  className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-400 cursor-not-allowed"
                  title="Save as Draft feature coming soon"
                >
                  Save as Draft (Coming Soon)
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
                      {job.status === 'error' && (
                        <AlertCircle className="mr-3 h-5 w-5 text-red-500" />
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
                        {job.error && (
                          <p className="mt-1 text-sm text-red-600">
                            ❌ {job.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditJob(job)}
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handlePreviewJob(job)}
                        className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-700 transition-colors"
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Preview
                      </button>
                      {!job.optimized && (
                        <button
                          onClick={() => handleOptimizeJob(job)}
                          className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                        >
                          <Sparkles className="mr-1 h-3 w-3" />
                          Optimize
                        </button>
                      )}
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
                    <input
                      type="checkbox"
                      className="mr-3 rounded"
                      checked={optimizationSettings.autoEnhance}
                      onChange={(e) => setOptimizationSettings({...optimizationSettings, autoEnhance: e.target.checked})}
                    />
                    <span className="text-sm text-gray-700">Auto-enhance job descriptions</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-3 rounded"
                      checked={optimizationSettings.addKeywords}
                      onChange={(e) => setOptimizationSettings({...optimizationSettings, addKeywords: e.target.checked})}
                    />
                    <span className="text-sm text-gray-700">Add relevant keywords for SEO</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-3 rounded"
                      checked={optimizationSettings.generateGraphics}
                      onChange={(e) => setOptimizationSettings({...optimizationSettings, generateGraphics: e.target.checked})}
                    />
                    <span className="text-sm text-gray-700">Generate social media graphics (+1 credit each)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-3 rounded"
                      checked={optimizationSettings.createFeatured}
                      onChange={(e) => setOptimizationSettings({...optimizationSettings, createFeatured: e.target.checked})}
                    />
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
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={optimizationSettings.optimizationLevel}
                      onChange={(e) => setOptimizationSettings({...optimizationSettings, optimizationLevel: e.target.value as 'standard' | 'enhanced' | 'premium'})}
                    >
                      <option value="standard">Standard (included)</option>
                      <option value="enhanced">Enhanced (+0.5 credits each)</option>
                      <option value="premium">Premium (+1 credit each)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Audience
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={optimizationSettings.targetAudience}
                      onChange={(e) => setOptimizationSettings({...optimizationSettings, targetAudience: e.target.value})}
                    >
                      <option value="general">General 209 Area</option>
                      <option value="tech">Tech Professionals</option>
                      <option value="healthcare">Healthcare Workers</option>
                      <option value="retail">Retail & Service</option>
                      <option value="manufacturing">Manufacturing</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  showSuccess('Optimization settings saved successfully!');
                  setShowOptimization(false);
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Support Section */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Having trouble with bulk uploads? Our support team is here to help you get the most out of your job posting experience.
              </p>
            </div>
            <button
              onClick={() => setShowSupportModal(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 flex items-center"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact Support
            </button>
          </div>
        </div>

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

        {/* Edit Job Modal */}
        {editingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="max-w-2xl w-full mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Edit Job</h2>
                  <button
                    onClick={() => setEditingJob(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={editingJob.title}
                      onChange={(e) => setEditingJob({...editingJob, title: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={editingJob.company || ''}
                      onChange={(e) => setEditingJob({...editingJob, company: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editingJob.location}
                      onChange={(e) => setEditingJob({...editingJob, location: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Type
                    </label>
                    <select
                      value={editingJob.jobType || ''}
                      onChange={(e) => setEditingJob({...editingJob, jobType: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salary
                    </label>
                    <input
                      type="text"
                      value={editingJob.salary || ''}
                      onChange={(e) => setEditingJob({...editingJob, salary: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="e.g., $50,000 - $70,000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingJob.description || ''}
                      onChange={(e) => setEditingJob({...editingJob, description: e.target.value})}
                      rows={6}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setEditingJob(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEdit(editingJob)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Job Modal */}
        {previewJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="max-w-4xl w-full mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Job Preview</h2>
                  <button
                    onClick={() => setPreviewJob(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">{previewJob.title}</h1>
                    <div className="flex items-center gap-4 mt-2 text-gray-600">
                      <span className="flex items-center">
                        <Building className="mr-1 h-4 w-4" />
                        {previewJob.company}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="mr-1 h-4 w-4" />
                        {previewJob.location}
                      </span>
                      {previewJob.salary && (
                        <span className="flex items-center">
                          <DollarSign className="mr-1 h-4 w-4" />
                          {previewJob.salary}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {previewJob.jobType}
                      </span>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Description</h3>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {previewJob.description || 'No description provided.'}
                    </div>
                  </div>

                  {previewJob.optimized && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <Sparkles className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">
                          This job has been AI-optimized
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setPreviewJob(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setEditingJob(previewJob);
                      setPreviewJob(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support Modal */}
        {showSupportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="max-w-2xl w-full mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Get Help</h2>
                  <button
                    onClick={() => {
                      setShowSupportModal(false);
                      setGenieResponse(null);
                      setShowGenieFirst(true);
                      setSupportMessage('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {showGenieFirst && !genieResponse && (
                  <div className="mb-4">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 mr-3" />
                        <div>
                          <h3 className="font-medium text-purple-900 mb-1">Try AI Support First! 🧞‍♂️</h3>
                          <p className="text-sm text-purple-800">
                            Our Support Genie can instantly help with common bulk upload questions. Get answers in seconds!
                          </p>
                        </div>
                      </div>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What do you need help with?
                    </label>
                    <textarea
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      placeholder="e.g., 'My CSV file won't upload' or 'How do I format job descriptions?'"
                    />

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleGenieSupport}
                        disabled={askingGenie || !supportMessage.trim()}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {askingGenie ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Asking Genie...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Ask Support Genie
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowGenieFirst(false)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Skip to Human Support
                      </button>
                    </div>
                  </div>
                )}

                {genieResponse && (
                  <div className="mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <Sparkles className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                        <div>
                          <h3 className="font-medium text-green-900 mb-2">Support Genie Response:</h3>
                          <div className="text-sm text-green-800 whitespace-pre-wrap">{genieResponse}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowSupportModal(false);
                          setGenieResponse(null);
                          setShowGenieFirst(true);
                          setSupportMessage('');
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Problem Solved!
                      </button>
                      <button
                        onClick={() => setShowGenieFirst(false)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Still Need Human Help
                      </button>
                    </div>
                  </div>
                )}

                {!showGenieFirst && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Need to speak with a human? Describe your issue and our support team will get back to you within 24 hours.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start">
                        <MessageCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                        <div className="text-xs text-blue-800">
                          <p className="font-medium">Direct Contact</p>
                          <p>For urgent issues, email us directly at <a href="mailto:support@209.works" className="underline">support@209.works</a></p>
                        </div>
                      </div>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe your issue or question:
                    </label>
                    <textarea
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Please provide as much detail as possible about your issue..."
                    />

                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={() => setShowGenieFirst(true)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Back to AI Support
                      </button>
                      <button
                        onClick={handleSupportSubmit}
                        disabled={sendingSupport || !supportMessage.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                      >
                        {sendingSupport ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Send to Human Support
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-xl">
              <div className="p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Subscription Required
                  </h3>

                  <p className="text-sm text-gray-600 mb-6">
                    Bulk upload is a premium feature. Choose a plan to start uploading multiple jobs efficiently.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-blue-900 mb-2">Bulk Upload Benefits:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Upload multiple jobs at once</li>
                      <li>• AI-powered job optimization</li>
                      <li>• Automatic formatting and enhancement</li>
                      <li>• Save time with batch processing</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpgrade}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                    >
                      View Plans
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-4">
                    Plans start at $99/month • Starter, Standard, and Pro tiers available
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Modal */}
        {showInstructionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="max-w-2xl w-full mx-4 bg-white rounded-lg shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">How Bulk Upload Works</h2>
                  <button
                    onClick={() => setShowInstructionsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#2d4a3e] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Prepare Your File</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Download our CSV template or create your own file with these columns:
                      </p>
                      <div className="text-xs bg-gray-50 p-2 rounded border font-mono">
                        <strong>Required:</strong> title, company, location, description<br/>
                        <strong>Optional:</strong> jobType, salary, requirements, benefits, experienceLevel, remote
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        <strong>💡 Flexible Formats:</strong> Job types can be "Full-time", "full_time", "Part-time", "Contract", etc.
                        Experience levels accept "Entry", "Mid-level", "Senior", "Executive".
                        Remote can be "Yes", "No", "true", "false", or "remote".
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#ff6b35] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Upload & Process</h3>
                      <p className="text-sm text-gray-600">
                        Drag and drop your CSV, Excel, or JSON file. Our AI will automatically validate and optimize each job posting for better visibility.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#9fdf9f] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Review & Publish</h3>
                      <p className="text-sm text-gray-600">
                        Review the processed jobs, edit any details if needed, and publish all at once. Each job uses 1 credit.
                      </p>
                    </div>
                  </div>

                  {/* Quick Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">💡 Quick Tips</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• File size limit: 10MB</li>
                      <li>• Supported formats: CSV, Excel (.xlsx), JSON</li>
                      <li>• Each job posting requires 1 credit</li>
                      <li>• AI optimization is included at no extra cost</li>
                      <li>• You can edit jobs before publishing</li>
                      <li>• <strong>Flexible formats:</strong> Use "Full-time" or "full_time" - both work!</li>
                      <li>• Boolean fields accept: Yes/No, True/False, 1/0</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={downloadTemplate}
                    className="px-4 py-2 text-[#2d4a3e] border border-[#2d4a3e] rounded-lg hover:bg-[#2d4a3e] hover:text-white transition-colors"
                  >
                    Download Template
                  </button>
                  <button
                    onClick={() => setShowInstructionsModal(false)}
                    className="px-4 py-2 bg-[#2d4a3e] text-white rounded-lg hover:bg-[#1d3a2e] transition-colors"
                  >
                    Got It!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
