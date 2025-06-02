'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function EmployerBulkUploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle');
  const [processedJobs, setProcessedJobs] = useState<any[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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
          { id: 1, title: 'Software Engineer', status: 'success', location: 'Stockton, CA' },
          { id: 2, title: 'Marketing Manager', status: 'success', location: 'Modesto, CA' },
          { id: 3, title: 'Sales Representative', status: 'warning', location: 'Tracy, CA', warning: 'Missing salary range' },
        ]);
      }, 2000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Job Upload</h1>
          <p className="text-gray-600">
            Upload multiple job postings at once with AI optimization. Save time and ensure quality with our intelligent processing.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white p-6 rounded-xl transition-colors">
            <Download className="w-8 h-8 mb-3" />
            <h3 className="font-semibold mb-2">Download Template</h3>
            <p className="text-sm opacity-90">Get our CSV template with all required fields</p>
          </button>

          <Link href="/employers/post-job" className="bg-[#2d4a3e] hover:bg-[#1d3a2e] text-white p-6 rounded-xl transition-colors block">
            <Sparkles className="w-8 h-8 mb-3 text-[#9fdf9f]" />
            <h3 className="font-semibold mb-2">AI Job Optimizer</h3>
            <p className="text-sm opacity-90">Create optimized job posts one at a time</p>
          </Link>

          <button className="bg-white border-2 border-gray-200 hover:border-[#2d4a3e] p-6 rounded-xl transition-colors">
            <FileText className="w-8 h-8 mb-3 text-[#2d4a3e]" />
            <h3 className="font-semibold mb-2 text-gray-900">Upload History</h3>
            <p className="text-sm text-gray-600">View previous bulk uploads</p>
          </button>
        </div>

        {/* Upload Zone */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Your Jobs</h2>

          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
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
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Drag and drop your file here
                </h3>
                <p className="text-gray-600 mb-6">
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
                  className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </>
            )}

            {uploadStatus === 'uploading' && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ff6b35] mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Uploading...</h3>
                <p className="text-gray-600">Processing your file</p>
              </div>
            )}

            {uploadStatus === 'processing' && (
              <div className="text-center">
                <Sparkles className="w-16 h-16 text-[#2d4a3e] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Processing...</h3>
                <p className="text-gray-600">Optimizing job descriptions and validating data</p>
              </div>
            )}

            {uploadStatus === 'complete' && (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-[#9fdf9f] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Complete!</h3>
                <p className="text-gray-600">Your jobs have been processed and are ready for review</p>
              </div>
            )}
          </div>

          {uploadedFile && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-[#2d4a3e] mr-3" />
                  <span className="font-medium text-gray-900">{uploadedFile.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({(uploadedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                {uploadStatus === 'complete' && (
                  <CheckCircle className="w-5 h-5 text-[#9fdf9f]" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Processing Results */}
        {uploadStatus === 'complete' && processedJobs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Processing Results</h2>
              <div className="flex gap-3">
                <button className="bg-[#2d4a3e] hover:bg-[#1d3a2e] text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Publish All
                </button>
                <button className="border border-gray-300 hover:border-[#2d4a3e] text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
                  Save as Draft
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {processedJobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {job.status === 'success' && (
                        <CheckCircle className="w-5 h-5 text-[#9fdf9f] mr-3" />
                      )}
                      {job.status === 'warning' && (
                        <AlertCircle className="w-5 h-5 text-[#ff6b35] mr-3" />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.location}</p>
                        {job.warning && (
                          <p className="text-sm text-[#ff6b35] mt-1">⚠️ {job.warning}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-[#2d4a3e] hover:text-[#1d3a2e] font-medium text-sm">
                        Edit
                      </button>
                      <button className="text-[#ff6b35] hover:text-[#e55a2b] font-medium text-sm">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <Sparkles className="w-8 h-8 text-[#2d4a3e] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Optimization</h3>
            <p className="text-gray-600 text-sm">
              Automatically enhance job descriptions for better candidate attraction and ATS compatibility.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <CheckCircle className="w-8 h-8 text-[#9fdf9f] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Validation</h3>
            <p className="text-gray-600 text-sm">
              Real-time validation ensures all required fields are complete and properly formatted.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <Upload className="w-8 h-8 text-[#ff6b35] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Batch Processing</h3>
            <p className="text-gray-600 text-sm">
              Upload hundreds of jobs at once with intelligent processing and error handling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}