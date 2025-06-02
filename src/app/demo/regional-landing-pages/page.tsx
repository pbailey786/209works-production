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
    description: 'Agricultural and logistics hub of California'
  },
  {
    id: '916',
    name: 'Sacramento Metro',
    domain: '916.works',
    color: '#1E40AF',
    accent: '#D97706',
    description: 'California\'s capital region with government and tech opportunities'
  },
  {
    id: '510',
    name: 'East Bay',
    domain: '510.works',
    color: '#0EA5E9',
    accent: '#EA580C',
    description: 'Innovation ecosystem of the Bay Area'
  },
  {
    id: 'norcal',
    name: 'Northern California',
    domain: 'norcal.works',
    color: '#1D4ED8',
    accent: '#CA8A04',
    description: 'Comprehensive Northern California job hub'
  }
];

export default function RegionalLandingPagesDemo() {
  const [selectedRegion, setSelectedRegion] = useState('209');
  const [viewMode, setViewMode] = useState<'preview' | 'fullscreen'>('preview');

  const currentRegion = REGIONS.find(r => r.id === selectedRegion);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Regional Landing Pages Demo</h1>
              <p className="text-gray-600 mt-2">
                Preview and test all regional landing page designs for the .works domain strategy
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                onClick={() => setViewMode('preview')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                variant={viewMode === 'fullscreen' ? 'default' : 'outline'}
                onClick={() => setViewMode('fullscreen')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Fullscreen
              </Button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'preview' ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Regional Designs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {REGIONS.map((region) => (
                    <div
                      key={region.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedRegion === region.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedRegion(region.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: region.color }}
                        >
                          {region.id.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{region.name}</div>
                          <div className="text-xs text-gray-500">{region.domain}</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{region.description}</p>
                      <div className="flex gap-1 mt-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: region.color }}
                        />
                        <div
                          className="w-3 h-3 rounded-full"
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
                        <label className="text-sm font-medium text-gray-700">Domain</label>
                        <div className="text-sm text-gray-900">{currentRegion.domain}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Primary Color</label>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: currentRegion.color }}
                          />
                          <span className="text-sm text-gray-900">{currentRegion.color}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Accent Color</label>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: currentRegion.accent }}
                          />
                          <span className="text-sm text-gray-900">{currentRegion.accent}</span>
                        </div>
                      </div>
                      <div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(`/regional/${currentRegion.id}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
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
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {currentRegion?.name} Landing Page Preview
                    </CardTitle>
                    <Badge variant="outline">
                      {currentRegion?.domain}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="text-sm text-gray-600 ml-2">
                        https://{currentRegion?.domain}
                      </div>
                    </div>
                    <div className="h-[600px] overflow-auto">
                      <div className="transform scale-75 origin-top-left w-[133.33%] h-[133.33%]">
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
                <Code className="w-5 h-5" />
                Implementation Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Dynamic Branding</h4>
                  <p className="text-sm text-gray-600">
                    Each region has unique colors, messaging, and visual identity
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Real-time Data</h4>
                  <p className="text-sm text-gray-600">
                    Live job statistics and recent postings from regional APIs
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">SEO Optimized</h4>
                  <p className="text-sm text-gray-600">
                    Regional metadata, Open Graph images, and structured data
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Responsive Design</h4>
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