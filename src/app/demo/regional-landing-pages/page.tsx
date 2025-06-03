/**
 * Regional Landing Pages Demo
 * Showcases all regional landing page designs for testing and development
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RegionalLandingPage from '@/components/regional/RegionalLandingPage';
import { ExternalLink, Eye, Code, Palette } from 'lucide-react';

const REGIONS = [
  {
    id: '209',
    name: 'Central Valley',
    domain: '209.works',
    color: '#2563EB',
    accent: '#F59E0B',
    description: 'Agricultural and logistics hub of California',
  },
  {
    id: '916',
    name: 'Sacramento Metro',
    domain: '916.works',
    color: '#1E40AF',
    accent: '#D97706',
    description:
      "California's capital region with government and tech opportunities",
  },
  {
    id: '510',
    name: 'East Bay',
    domain: '510.works',
    color: '#0EA5E9',
    accent: '#EA580C',
    description: 'Innovation ecosystem of the Bay Area',
  },
  {
    id: 'norcal',
    name: 'Northern California',
    domain: 'norcal.works',
    color: '#1D4ED8',
    accent: '#CA8A04',
    description: 'Comprehensive Northern California job hub',
  },
];

export default function RegionalLandingPagesDemo() {
  const [selectedRegion, setSelectedRegion] = useState('209');
  const [viewMode, setViewMode] = useState<'preview' | 'fullscreen'>('preview');

  const currentRegion = REGIONS.find(r => r.id === selectedRegion);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Regional Landing Pages Demo
              </h1>
              <p className="mt-2 text-gray-600">
                Preview and test all regional landing page designs for the
                .works domain strategy
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                onClick={() => setViewMode('preview')}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                variant={viewMode === 'fullscreen' ? 'default' : 'outline'}
                onClick={() => setViewMode('fullscreen')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Fullscreen
              </Button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'preview' ? (
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-4">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Regional Designs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {REGIONS.map(region => (
                    <div
                      key={region.id}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        selectedRegion === region.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedRegion(region.id)}
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: region.color }}
                        >
                          {region.id.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            {region.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {region.domain}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">
                        {region.description}
                      </p>
                      <div className="mt-2 flex gap-1">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: region.color }}
                        />
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: region.accent }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Current Region Info */}
              {currentRegion && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Current Region</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Domain
                        </label>
                        <div className="text-sm text-gray-900">
                          {currentRegion.domain}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Primary Color
                        </label>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded"
                            style={{ backgroundColor: currentRegion.color }}
                          />
                          <span className="text-sm text-gray-900">
                            {currentRegion.color}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Accent Color
                        </label>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded"
                            style={{ backgroundColor: currentRegion.accent }}
                          />
                          <span className="text-sm text-gray-900">
                            {currentRegion.accent}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            window.open(
                              `/regional/${currentRegion.id}`,
                              '_blank'
                            )
                          }
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in New Tab
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Preview Area */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {currentRegion?.name} Landing Page Preview
                    </CardTitle>
                    <Badge variant="outline">{currentRegion?.domain}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-hidden rounded-lg border">
                    <div className="flex items-center gap-2 border-b bg-gray-100 px-4 py-2">
                      <div className="flex gap-1">
                        <div className="h-3 w-3 rounded-full bg-red-400"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                        <div className="h-3 w-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="ml-2 text-sm text-gray-600">
                        https://{currentRegion?.domain}
                      </div>
                    </div>
                    <div className="h-[600px] overflow-auto">
                      <div className="h-[133.33%] w-[133.33%] origin-top-left scale-75 transform">
                        <RegionalLandingPage region={selectedRegion} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Features Overview */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Implementation Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <h4 className="mb-2 font-semibold text-gray-900">
                    Dynamic Branding
                  </h4>
                  <p className="text-sm text-gray-600">
                    Each region has unique colors, messaging, and visual
                    identity
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-gray-900">
                    Real-time Data
                  </h4>
                  <p className="text-sm text-gray-600">
                    Live job statistics and recent postings from regional APIs
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-gray-900">
                    SEO Optimized
                  </h4>
                  <p className="text-sm text-gray-600">
                    Regional metadata, Open Graph images, and structured data
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-gray-900">
                    Responsive Design
                  </h4>
                  <p className="text-sm text-gray-600">
                    Mobile-first design that works across all devices
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Fullscreen mode
        <div className="h-screen">
          <RegionalLandingPage region={selectedRegion} />
        </div>
      )}
    </div>
  );
}
