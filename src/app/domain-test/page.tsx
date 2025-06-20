'use client';

import React from 'react';
import { useDomain } from '@/lib/domain/context';
import DomainAwareHeader from '@/components/layout/DomainAwareHeader';
import DomainAwareFooter from '@/components/layout/DomainAwareFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  MapPin, 
  Users, 
  Briefcase, 
  Palette,
  Code,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export default function DomainTestPage() {
  const { config, isLoading } = useDomain();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DomainAwareHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const otherDomains = [
    { name: '209 Works', domain: '209.works', areaCode: '209', region: 'Central Valley' },
    { name: '916 Works', domain: '916.works', areaCode: '916', region: 'Sacramento Area' },
    { name: '510 Works', domain: '510.works', areaCode: '510', region: 'East Bay' },
    { name: '925 Works', domain: '925.works', areaCode: '925', region: 'East Bay & Tri-Valley' },
    { name: '559 Works', domain: '559.works', areaCode: '559', region: 'Fresno Area' },
  ].filter(domain => domain.areaCode !== config.areaCode);

  return (
    <div className="min-h-screen bg-background">
      <DomainAwareHeader />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Multi-Domain System Test
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            This page demonstrates how the 209 Works platform adapts to different domains,
            showing region-specific content, branding, and functionality.
          </p>
        </div>

        {/* Current Domain Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Current Domain Configuration
            </CardTitle>
            <CardDescription>
              Information about the current domain you're viewing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Domain Details</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Domain:</strong> {config.domain}</div>
                  <div><strong>Display Name:</strong> {config.displayName}</div>
                  <div><strong>Area Code:</strong> {config.areaCode}</div>
                  <div><strong>Region:</strong> {config.region}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Branding</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: config.branding.primaryColor }}
                    />
                    <span className="text-sm">Primary: {config.branding.primaryColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: config.branding.accentColor }}
                    />
                    <span className="text-sm">Accent: {config.branding.accentColor}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Coverage Area</h4>
                <div className="flex flex-wrap gap-1">
                  {config.cities.map((city) => (
                    <Badge key={city} variant="outline" className="text-xs">
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Demonstration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Regional Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Regional Content
              </CardTitle>
              <CardDescription>
                Content automatically adapts to the current region
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Hero Message</h4>
                <p className="text-sm text-gray-600">
                  "Built for the {config.areaCode}. Made for the people who work here.
                  Find your next opportunity in {config.region}."
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Local Focus</h4>
                <p className="text-sm text-gray-600">
                  "Every job is in the {config.areaCode} area code. No remote work, 
                  no out-of-state positions. Just local opportunities for local people in {config.region}."
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">AI Assistant Context</h4>
                <p className="text-sm text-gray-600">
                  "I'm here to help you find work in the {config.areaCode} area - {config.cities.slice(0, 3).join(', ')} 
                  and all around {config.region}."
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Technical Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Technical Implementation
              </CardTitle>
              <CardDescription>
                How the multi-domain system works under the hood
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Domain Detection</h4>
                  <p className="text-xs text-gray-600">
                    Middleware automatically detects the domain and sets regional context
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Dynamic Metadata</h4>
                  <p className="text-xs text-gray-600">
                    SEO titles, descriptions, and meta tags adapt to each region
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Regional Job Filtering</h4>
                  <p className="text-xs text-gray-600">
                    Job searches automatically filter to the current region
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Shared Codebase</h4>
                  <p className="text-xs text-gray-600">
                    Single codebase powers all regional domains with dynamic configuration
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Other Domains */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Other Regional Domains
            </CardTitle>
            <CardDescription>
              Visit other regions to see how content adapts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {otherDomains.map((domain) => (
                <div key={domain.areaCode} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{domain.name}</h4>
                    <Badge variant="outline">{domain.areaCode}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{domain.region}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(`https://${domain.domain}/domain-test`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit {domain.domain}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
            <CardDescription>
              Steps to verify the multi-domain functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Visit different domain URLs (209.works, 916.works, 510.works, 925.works, 559.works)</li>
              <li>Notice how the header, branding colors, and content change</li>
              <li>Check the footer for region-specific information</li>
              <li>Try searching for jobs - results will be filtered by region</li>
              <li>Look at the page title and meta description in browser tabs</li>
              <li>Use the JobsGPT chat - it will reference the correct region</li>
            </ol>
          </CardContent>
        </Card>
      </div>
      
      <DomainAwareFooter />
    </div>
  );
}
