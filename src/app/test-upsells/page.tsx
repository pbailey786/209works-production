'use client';

import React, { useState } from 'react';
import JobUpsellSelector from '@/components/job-posting/JobUpsellSelector';
import JobUpsellModal from '@/components/job-posting/JobUpsellModal';

export default function TestUpsellsPage() {
  const [selectorSelection, setSelectorSelection] = useState({
    socialMediaShoutout: false,
    placementBump: false,
    upsellBundle: false,
    total: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Job Upsells Test Page
          </h1>
          <p className="text-gray-600">
            Test the upsell components for job posting
          </p>
        </div>

        {/* Upsell Selector Test */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Upsell Selector Component
          </h2>
          <JobUpsellSelector onSelectionChange={setSelectorSelection} />

          {/* Debug Info */}
          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 font-medium text-gray-900">
              Current Selection:
            </h3>
            <pre className="text-sm text-gray-600">
              {JSON.stringify(selectorSelection, null, 2)}
            </pre>
          </div>
        </div>

        {/* Upsell Modal Test */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Upsell Modal Component
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Open Upsell Modal
            </button>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-2 font-medium text-gray-900">
                  Test Scenarios:
                </h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• No existing upsells</li>
                  <li>• All options available</li>
                  <li>• Bundle vs individual pricing</li>
                </ul>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-2 font-medium text-gray-900">Features:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Social Media Shoutout ($29)</li>
                  <li>• On-Site Placement Bump ($29)</li>
                  <li>• Complete Bundle ($50, save $8)</li>
                </ul>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-2 font-medium text-gray-900">Benefits:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Instagram & X promotion</li>
                  <li>• AI chatbot recommendations</li>
                  <li>• Higher search visibility</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Job Cards with Upsell Badges */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Job Cards with Upsell Badges
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Sample Job 1 - Social Media Only */}
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Customer Service Rep
                  </h3>
                  <p className="text-gray-600">Acme Corp</p>
                  <p className="text-sm text-gray-500">Stockton, CA</p>
                </div>
              </div>

              {/* Upsell Badges */}
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-pink-200 bg-gradient-to-r from-pink-100 to-purple-100 px-3 py-1 text-xs font-medium text-pink-700">
                  📢 Social Media Promoted
                </span>
              </div>

              <p className="text-sm text-gray-600">
                Join our friendly team and help customers with their needs...
              </p>
            </div>

            {/* Sample Job 2 - Full Bundle */}
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Sales Associate
                  </h3>
                  <p className="text-gray-600">Local Retail Store</p>
                  <p className="text-sm text-gray-500">Modesto, CA</p>
                </div>
              </div>

              {/* Upsell Badges */}
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-pink-200 bg-gradient-to-r from-pink-100 to-purple-100 px-3 py-1 text-xs font-medium text-pink-700">
                  📢 Social Media Promoted
                </span>
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-gradient-to-r from-blue-100 to-green-100 px-3 py-1 text-xs font-medium text-blue-700">
                  📈 Priority Placement
                </span>
                <span className="inline-flex items-center rounded-full border border-orange-200 bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                  ✨ Premium Promotion
                </span>
              </div>

              <p className="text-sm text-gray-600">
                Great opportunity for someone who loves helping customers...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upsell Modal */}
      <JobUpsellModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        jobId="test-job-id"
        jobTitle="Customer Service Representative"
        company="Acme Corp"
        currentUpsells={{
          socialMediaShoutout: false,
          placementBump: false,
          upsellBundle: false,
        }}
        onSuccess={() => {
          console.log('Upsells purchased successfully!');
        }}
      />
    </div>
  );
}
