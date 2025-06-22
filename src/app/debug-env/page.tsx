'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface EnvTestResult {
  success: boolean;
  validation: {
    isValid: boolean;
    missing: string[];
    invalid: string[];
    warnings: string[];
  };
  config: {
    openai: {
      hasKey: boolean;
      keyLength: number;
      isValidFormat: boolean;
    };
    database: {
      hasUrl: boolean;
      isValidFormat: boolean;
    };
    auth: {
      hasSecret: boolean;
      hasUrl: boolean;
    };
    email: {
      hasResendKey: boolean;
      hasEmailFrom: boolean;
    };
  };
  features: {
    resumeParsingAvailable: boolean;
  };
  message: string;
  timestamp: string;
}

export default function DebugEnvironmentPage() {
  const [envResult, setEnvResult] = useState<EnvTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testEnvironment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/test-env');
      const data = await response.json();

      if (response.ok) {
        setEnvResult(data);
      } else {
        setError(data.error || 'Failed to test environment');
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testEnvironment();
  }, []);

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Environment Debug</h1>
            <button
              onClick={testEnvironment}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-900 font-medium">Error: {error}</span>
              </div>
            </div>
          )}

          {envResult && (
            <div className="space-y-6">
              {/* Overall Status */}
              <div className={`p-4 rounded-lg border ${
                envResult.validation.isValid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center">
                  {getStatusIcon(envResult.validation.isValid)}
                  <span className={`ml-2 font-medium ${
                    envResult.validation.isValid ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {envResult.message}
                  </span>
                </div>
              </div>

              {/* Configuration Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* OpenAI Configuration */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">OpenAI Configuration</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>API Key Present:</span>
                      {getStatusIcon(envResult.config.openai.hasKey)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Key Length:</span>
                      <span className="text-sm text-gray-600">{envResult.config.openai.keyLength} chars</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Valid Format:</span>
                      {getStatusIcon(envResult.config.openai.isValidFormat)}
                    </div>
                  </div>
                </div>

                {/* Database Configuration */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Database Configuration</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Database URL:</span>
                      {getStatusIcon(envResult.config.database.hasUrl)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Valid Format:</span>
                      {getStatusIcon(envResult.config.database.isValidFormat)}
                    </div>
                  </div>
                </div>

                {/* Auth Configuration */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Authentication</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>NextAuth Secret:</span>
                      {getStatusIcon(envResult.config.auth.hasSecret)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>NextAuth URL:</span>
                      {getStatusIcon(envResult.config.auth.hasUrl)}
                    </div>
                  </div>
                </div>

                {/* Email Configuration */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Email Service</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Resend API Key:</span>
                      {getStatusIcon(envResult.config.email.hasResendKey)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Email From:</span>
                      {getStatusIcon(envResult.config.email.hasEmailFrom)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Availability */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-3">Feature Availability</h3>
                <div className="flex items-center justify-between">
                  <span>Resume Parsing:</span>
                  {getStatusIcon(envResult.features.resumeParsingAvailable)}
                </div>
              </div>

              {/* Issues */}
              {(envResult.validation.missing.length > 0 || 
                envResult.validation.invalid.length > 0 || 
                envResult.validation.warnings.length > 0) && (
                <div className="space-y-4">
                  {envResult.validation.missing.length > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">Missing Variables:</h4>
                      <ul className="list-disc list-inside text-red-800">
                        {envResult.validation.missing.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {envResult.validation.invalid.length > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">Invalid Variables:</h4>
                      <ul className="list-disc list-inside text-red-800">
                        {envResult.validation.invalid.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {envResult.validation.warnings.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">Warnings:</h4>
                      <ul className="list-disc list-inside text-yellow-800">
                        {envResult.validation.warnings.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <div className="text-sm text-gray-500 text-center">
                Last checked: {new Date(envResult.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
