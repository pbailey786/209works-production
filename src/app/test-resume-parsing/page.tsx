'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TestResumeParsingPage() {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError(null);
    }
  };

  const testResumeParsingWithDebug = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const response = await fetch('/api/debug/resume-parse', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Unknown error occurred');
        setResult(data); // Include debug info even on error
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const testOriginalResumeParsingEndpoint = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Unknown error occurred');
        setResult(data);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Resume Parsing Test</h1>
          <p className="text-gray-600">Please sign in to test resume parsing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Parsing Test</h1>
          <p className="text-gray-600 mb-8">
            Test the resume parsing functionality and see detailed debug information
          </p>

          {/* File Upload Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Resume</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <input
                type="file"
                accept=".doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose DOCX File
              </label>
              <p className="mt-2 text-sm text-gray-500">
                Only DOCX and DOC files are supported (max 5MB)
              </p>
            </div>

            {selectedFile && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-blue-900 font-medium">{selectedFile.name}</span>
                  <span className="ml-2 text-blue-600 text-sm">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Test Buttons */}
          {selectedFile && (
            <div className="mb-8 flex gap-4">
              <button
                onClick={testResumeParsingWithDebug}
                disabled={isProcessing}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                ) : (
                  <AlertCircle className="mr-2 h-4 w-4" />
                )}
                Test with Debug Info
              </button>

              <button
                onClick={testOriginalResumeParsingEndpoint}
                disabled={isProcessing}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Test Original Endpoint
              </button>
            </div>
          )}

          {/* Results Section */}
          {(result || error) && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>
              
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-900 font-medium">Error: {error}</span>
                  </div>
                </div>
              )}

              {result?.success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-900 font-medium">Success!</span>
                  </div>
                </div>
              )}

              {/* Debug Information */}
              {result?.debug && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Debug Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium mb-2">Processing Step: {result.debug.step}</p>
                    <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                      {JSON.stringify(result.debug.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Parsed Data */}
              {result?.data && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Parsed Data</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Full Response */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Full Response</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm bg-white p-3 rounded border overflow-x-auto max-h-96">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Instructions</h3>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>Upload a DOCX or DOC resume file</li>
              <li>Click "Test with Debug Info" to see detailed debugging information</li>
              <li>Check the console logs for additional debugging information</li>
              <li>If parsing fails, the debug info will show you exactly where it failed</li>
              <li>Make sure your OpenAI API key is configured in environment variables</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}