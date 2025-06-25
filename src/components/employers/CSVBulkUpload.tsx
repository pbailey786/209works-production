'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, Eye } from 'lucide-react';

interface CSVJobData {
  title: string;
  description: string;
  requirements: string;
  salary: string;
  location: string;
  jobType: string;
  contactEmail?: string;
  [key: string]: string | undefined;
}

interface CSVBulkUploadProps {
  onJobsProcessed: (jobs: CSVJobData[]) => void;
}

export default function CSVBulkUpload({ onJobsProcessed }: CSVBulkUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedJobs, setProcessedJobs] = useState<CSVJobData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = `title,description,requirements,salary,location,jobType,contactEmail
"Cashier","Looking for a reliable cashier for our grocery store","Must be available weekends, basic math skills","$18-20/hour","Stockton, CA","full-time","manager@store.com"
"Warehouse Worker","Need warehouse worker for shipping/receiving","Ability to lift 50lbs, forklift experience preferred","$22-25/hour","Modesto, CA","full-time","hr@warehouse.com"
"Sales Associate","Retail sales position at clothing store","Customer service experience, flexible schedule","$16-18/hour","Fresno, CA","part-time","hiring@store.com"`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '209jobs-bulk-upload-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrors(['Please upload a CSV file']);
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrors(['File size must be under 5MB']);
      return;
    }

    setUploadedFile(file);
    setErrors([]);
  };

  const parseCSV = (text: string): CSVJobData[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have header row and at least one data row');

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const requiredHeaders = ['title', 'description', 'salary', 'location'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const jobs: CSVJobData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      if (values.length !== headers.length) continue;

      const job: any = {};
      headers.forEach((header, index) => {
        job[header] = values[index] || '';
      });

      // Validate required fields
      if (!job.title || !job.description || !job.salary || !job.location) {
        throw new Error(`Row ${i + 1}: Missing required fields`);
      }

      jobs.push(job as CSVJobData);
    }

    return jobs;
  };

  const processFile = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setErrors([]);

    try {
      const text = await uploadedFile.text();
      const jobs = parseCSV(text);

      if (jobs.length === 0) {
        throw new Error('No valid job data found in CSV');
      }

      if (jobs.length > 50) {
        throw new Error('Maximum 50 jobs per upload. Please split into smaller files.');
      }

      // Process each job with AI enhancement
      const response = await fetch('/api/employers/bulk-process-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs })
      });

      if (!response.ok) throw new Error('Failed to process jobs');

      const { processedJobs: enhancedJobs } = await response.json();
      setProcessedJobs(enhancedJobs);

    } catch (error) {
      console.error('CSV processing error:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to process CSV file']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinueToReview = () => {
    onJobsProcessed(processedJobs);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Bulk Job Upload
        </h2>
        <p className="text-lg text-gray-600">
          Upload multiple jobs at once with a CSV file. Our AI will optimize each job post for better results.
        </p>
      </div>

      {/* Template Download */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-3">
          <Download className="w-6 h-6 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900">Need a template?</h4>
            <p className="text-sm text-blue-700 mb-3">
              Download our CSV template with example job posts to get started quickly.
            </p>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      {!uploadedFile && (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Drag & drop your CSV file here
              </h3>
              <p className="text-gray-600 mt-2">
                Or click to browse and select a file
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose File
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="text-sm text-gray-500">
              <p>Maximum file size: 5MB</p>
              <p>Maximum jobs per upload: 50</p>
            </div>
          </div>
        </div>
      )}

      {/* File Selected */}
      {uploadedFile && !processedJobs.length && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">{uploadedFile.name}</h4>
                <p className="text-sm text-gray-600">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setUploadedFile(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              Remove
            </button>
          </div>

          <button
            onClick={processFile}
            disabled={isProcessing}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Processing with AI...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Process Jobs</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Upload Error</h4>
              <ul className="text-sm text-red-700 mt-1 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Processed Jobs Summary */}
      {processedJobs.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start space-x-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900">
                Successfully processed {processedJobs.length} jobs!
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Our AI has enhanced each job post for better candidate attraction and local relevance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {processedJobs.slice(0, 6).map((job, index) => (
              <div key={index} className="bg-white border border-green-200 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 text-sm">{job.title}</h5>
                <p className="text-xs text-gray-600">{job.location}</p>
                <p className="text-xs text-green-700">{job.salary}</p>
              </div>
            ))}
            {processedJobs.length > 6 && (
              <div className="bg-white border border-green-200 rounded-lg p-3 flex items-center justify-center">
                <span className="text-sm text-gray-600">
                  +{processedJobs.length - 6} more jobs
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleContinueToReview}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Eye className="w-5 h-5" />
            <span>Review & Post Jobs</span>
          </button>
        </div>
      )}
    </div>
  );
}