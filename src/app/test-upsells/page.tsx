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
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Job Upsells Test Page
          </h1>
          <p className="text-gray-600">
            Test the upsell components for job posting
          </p>
        </div>

        {/* Upsell Selector Test */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upsell Selector Component
          </h2>
          <JobUpsellSelector 
            onSelectionChange={setSelectorSelection}
          />
          
          {/* Debug Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Current Selection:</h3>
            <pre className="text-sm text-gray-600">
              {JSON.stringify(selectorSelection, null, 2)}
            </pre>
          </div>
        </div>

        {/* Upsell Modal Test */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upsell Modal Component
          </h2>
          
          <div className="space-y-4">
            <button
              onClick={() => setModalOpen(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Open Upsell Modal
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Test Scenarios:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• No existing upsells</li>
                  <li>• All options available</li>
                  <li>• Bundle vs individual pricing</li>
                </ul>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Social Media Shoutout ($29)</li>
                  <li>• On-Site Placement Bump ($29)</li>
                  <li>• Complete Bundle ($50, save $8)</li>
                </ul>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Benefits:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Instagram & X promotion</li>
                  <li>• AI chatbot recommendations</li>
                  <li>• Higher search visibility</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Job Cards with Upsell Badges */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Job Cards with Upsell Badges
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sample Job 1 - Social Media Only */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">Customer Service Rep</h3>
                  <p className="text-gray-600">Acme Corp</p>
                  <p className="text-sm text-gray-500">Stockton, CA</p>
                </div>
              </div>
              
              {/* Upsell Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 text-xs font-medium px-3 py-1 rounded-full border border-pink-200">
                  📢 Social Media Promoted
                </span>
              </div>
              
              <p className="text-sm text-gray-600">
                Join our friendly team and help customers with their needs...
              </p>
            </div>

            {/* Sample Job 2 - Full Bundle */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">Sales Associate</h3>
                  <p className="text-gray-600">Local Retail Store</p>
                  <p className="text-sm text-gray-500">Modesto, CA</p>
                </div>
              </div>
              
              {/* Upsell Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 text-xs font-medium px-3 py-1 rounded-full border border-pink-200">
                  📢 Social Media Promoted
                </span>
                <span className="inline-flex items-center bg-gradient-to-r from-blue-100 to-green-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full border border-blue-200">
                  📈 Priority Placement
                </span>
                <span className="inline-flex items-center bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 text-xs font-medium px-3 py-1 rounded-full border border-orange-200">
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
