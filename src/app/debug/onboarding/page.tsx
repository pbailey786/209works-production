'use client';

import { useState } from 'react';

export default function OnboardingDebugPage() {
  const [formData, setFormData] = useState({
    name: 'Test Company Owner',
    companyName: 'Test Company',
    companyWebsite: 'https://example.com',
    location: 'Modesto, CA',
    industry: 'technology',
    companySize: '1-10',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testOnboarding = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const dataToSend = {
        ...formData,
        onboardingCompleted: true,
        completedSteps: ['company', 'location', 'details'],
      };

      console.log('🚀 Sending test data:', dataToSend);

      const response = await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const responseData = await response.json();
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: responseData,
      });

      console.log('📦 Response:', {
        status: response.status,
        ok: response.ok,
        data: responseData,
      });
    } catch (error) {
      console.error('💥 Error:', error);
      setResult({
        status: 'error',
        error: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Onboarding Debug Test
        </h1>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Test Form Data</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Company Website</label>
              <input
                type="url"
                value={formData.companyWebsite}
                onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="retail">Retail</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Company Size</label>
              <select
                value={formData.companySize}
                onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
              </select>
            </div>
          </div>

          <button
            onClick={testOnboarding}
            disabled={isLoading}
            className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Onboarding API'}
          </button>
        </div>

        {result && (
          <div className="mt-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Result</h2>
            <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
