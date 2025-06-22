'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ResumeUploadStepProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
}

export default function ResumeUploadStep({ formData, setFormData, onNext }: ResumeUploadStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('idle');
    setUploadMessage('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('resume', file);

      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formDataUpload,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update form data with parsed resume information
        setFormData((prev: any) => ({
          ...prev,
          name: result.data.name || prev.name,
          email: result.data.email || prev.email,
          phoneNumber: result.data.phoneNumber || prev.phoneNumber,
          skills: result.data.skills || prev.skills,
          workHistory: result.data.workHistory || prev.workHistory,
          education: result.data.education || prev.education,
          // Extract zip code from location if available
          zipCode: extractZipCode(result.data.location) || prev.zipCode,
        }));

        setUploadStatus('success');
        setUploadMessage('Resume parsed successfully! Your information has been pre-filled.');
      } else {
        setUploadStatus('error');
        setUploadMessage(result.error || 'Failed to parse resume. You can still continue manually.');
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      setUploadStatus('error');
      setUploadMessage('Failed to upload resume. You can still continue manually.');
    } finally {
      setIsUploading(false);
    }
  };

  const extractZipCode = (location: string | null): string => {
    if (!location) return '';
    // Simple regex to extract 5-digit zip codes
    const zipMatch = location.match(/\b\d{5}\b/);
    return zipMatch ? zipMatch[0] : '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.type === 'application/pdf' || file.type.includes('document'))) {
      handleFileUpload(file);
    } else {
      setUploadStatus('error');
      setUploadMessage('Please upload a PDF or Word document.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isUploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Parsing your resume...</p>
            <p className="text-gray-600">This may take a few seconds</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Upload your resume
            </p>
            <p className="text-gray-600 mb-4">
              Drag and drop your resume here, or click to browse
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose File
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Supports PDF, DOC, and DOCX files
            </p>
          </div>
        )}
      </div>

      {/* Upload status */}
      {uploadStatus !== 'idle' && (
        <div className={`
          p-4 rounded-lg flex items-start space-x-3
          ${uploadStatus === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}
        `}>
          {uploadStatus === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          )}
          <div>
            <p className={`font-medium ${uploadStatus === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {uploadStatus === 'success' ? 'Success!' : 'Upload Failed'}
            </p>
            <p className={`text-sm ${uploadStatus === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {uploadMessage}
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={handleSkip}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          disabled={isUploading}
        >
          Skip for now
        </button>
        
        <button
          onClick={onNext}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          disabled={isUploading}
        >
          <span>Continue</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
