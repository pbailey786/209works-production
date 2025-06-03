'use client';

import { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function EmployerBulkUploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  >('idle');
  const [processedJobs, setProcessedJobs] = useState<any[]>([]);

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

  const handleFile = (file: File) => {
    setUploadedFile(file);
    setUploadStatus('uploading');

    // Simulate upload and processing
    setTimeout(() => {
      setUploadStatus('processing');
      setTimeout(() => {
        setUploadStatus('complete');
        // Mock processed jobs data
        setProcessedJobs([
          {
            id: 1,
            title: 'Software Engineer',
            status: 'success',
            location: 'Stockton, CA',
          },
          {
            id: 2,
            title: 'Marketing Manager',
            status: 'success',
            location: 'Modesto, CA',
          },
          {
            id: 3,
            title: 'Sales Representative',
            status: 'warning',
            location: 'Tracy, CA',
            warning: 'Missing salary range',
          },
        ]);
      }, 2000);
    }, 1000);
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

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <button className="rounded-xl bg-[#ff6b35] p-6 text-white transition-colors hover:bg-[#e55a2b]">
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

          <button className="rounded-xl border-2 border-gray-200 bg-white p-6 transition-colors hover:border-[#2d4a3e]">
            <FileText className="mb-3 h-8 w-8 text-[#2d4a3e]" />
            <h3 className="mb-2 font-semibold text-gray-900">Upload History</h3>
            <p className="text-sm text-gray-600">View previous bulk uploads</p>
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
              <h2 className="text-2xl font-bold text-gray-900">
                Processing Results
              </h2>
              <div className="flex gap-3">
                <button className="rounded-lg bg-[#2d4a3e] px-4 py-2 font-medium text-white transition-colors hover:bg-[#1d3a2e]">
                  Publish All
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
