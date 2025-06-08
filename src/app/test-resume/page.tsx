'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function TestResumePage() {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const testResumeDebug = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      console.log('🔍 Sending file to debug endpoint:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const response = await fetch('/api/debug/resume-parse', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      console.log('📥 Response from debug endpoint:', data);

      if (!response.ok) {
        setError(`Error ${response.status}: ${data.error || 'Unknown error'}`);
        setResult(data);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      console.error('❌ Network error:', err);
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testMinimalDebug = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      console.log('🔍 Sending file to minimal debug endpoint:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const response = await fetch('/api/debug/resume-parse-minimal', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      console.log('📥 Response from minimal debug endpoint:', data);

      if (!response.ok) {
        setError(`Error ${response.status}: ${data.error || 'Unknown error'}`);
        setResult(data);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      console.error('❌ Network error:', err);
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testActualResumeParse = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      console.log('🔍 Sending file to actual endpoint:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      console.log('📥 Response from actual endpoint:', data);

      if (!response.ok) {
        setError(`Error ${response.status}: ${data.error || 'Unknown error'}`);
        setResult(data);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      console.error('❌ Network error:', err);
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Resume Parser Test</h1>
          <p className="text-gray-600">Please sign in to test resume parsing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Resume Parser Test</h1>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Resume (Currently supported formats)
              </label>
              <input
                type="file"
                accept=".docx,.doc,.txt,.rtf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <div className="mt-2 text-xs text-gray-500">
                <p className="font-medium">Currently supported formats:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li><strong>Microsoft Word:</strong> DOCX, DOC (best quality)</li>
                  <li><strong>Text files:</strong> TXT, RTF</li>
                  <li><strong>Max size:</strong> 5MB</li>
                  <li className="text-amber-600"><strong>Coming soon:</strong> PDF and image support</li>
                </ul>
              </div>
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Test Buttons */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={testResumeDebug}
                disabled={!file || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test Debug Endpoint'}
              </button>

              <button
                onClick={testMinimalDebug}
                disabled={!file || loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test Minimal Debug'}
              </button>

              <button
                onClick={testActualResumeParse}
                disabled={!file || loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test Actual Endpoint'}
              </button>
            </div>

            {/* Results */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Result</h3>
                <pre className="text-sm text-gray-700 overflow-auto max-h-96 bg-white p-3 rounded border">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
