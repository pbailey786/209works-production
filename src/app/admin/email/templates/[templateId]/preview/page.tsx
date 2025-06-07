'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface TemplatePreview {
  html: string;
  subject: string;
  templateId: string;
}

export default function EmailTemplatePreviewPage() {
  const params = useParams();
  const templateId = params.templateId as string;
  const [preview, setPreview] = useState<TemplatePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/admin/email/templates/${templateId}/preview`);
        if (!response.ok) {
          throw new Error('Failed to fetch template preview');
        }
        const data = await response.json();
        setPreview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchPreview();
    }
  }, [templateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading template preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Template Not Found</h1>
          <p className="text-gray-600">The template "{templateId}" could not be found.</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Email Template Preview: {templateId}
              </h1>
              <p className="text-sm text-gray-500">Subject: {preview.subject}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => window.open(`/api/admin/email/templates/${templateId}/preview?format=html`, '_blank')}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Open in New Tab
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Email Preview</h2>
            <p className="text-sm text-gray-500">This is how the email will appear to recipients</p>
          </div>
          
          <div className="p-6">
            <div 
              className="email-preview"
              dangerouslySetInnerHTML={{ __html: preview.html }}
              style={{
                maxWidth: '600px',
                margin: '0 auto',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
