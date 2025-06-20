'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Code, 
  Key, 
  Activity, 
  Webhook, 
  Copy, 
  Eye, 
  EyeOff, 
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Settings,
  Book,
  Zap
} from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  scopes: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  status: 'active' | 'suspended' | 'revoked';
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'disabled' | 'failed';
  lastDeliveryAt?: string;
  failureCount: number;
  createdAt: string;
}

interface DeveloperDashboardProps {
  className?: string;
}

export default function DeveloperDashboard({ className = '' }: DeveloperDashboardProps) {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [showNewWebhookForm, setShowNewWebhookForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  useEffect(() => {
    fetchDeveloperData();
  }, []);

  const fetchDeveloperData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [keysResponse, webhooksResponse, analyticsResponse] = await Promise.all([
        fetch('/api/platform/keys'),
        fetch('/api/platform/webhooks'),
        fetch('/api/platform/analytics?timeRange=day'),
      ]);

      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        setApiKeys(keysData.data.apiKeys);
      }

      if (webhooksResponse.ok) {
        const webhooksData = await webhooksResponse.json();
        setWebhooks(webhooksData.data.webhooks);
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.data);
      }

    } catch (err) {
      console.error('Error fetching developer data:', err);
      setError('Failed to load developer data');
    } finally {
      setLoading(false);
    }
  };

  const createAPIKey = async (formData: {
    name: string;
    scopes: string[];
    tier: string;
    expiresInDays?: number;
  }) => {
    try {
      const response = await fetch('/api/platform/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setNewApiKey(data.data.apiKey.key);
        setShowNewKeyForm(false);
        await fetchDeveloperData();
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      setError('Failed to create API key');
    }
  };

  const revokeAPIKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/platform/keys/${keyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchDeveloperData();
      }
    } catch (error) {
      setError('Failed to revoke API key');
    }
  };

  const createWebhook = async (formData: {
    url: string;
    events: string[];
  }) => {
    try {
      const response = await fetch('/api/platform/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowNewWebhookForm(false);
        await fetchDeveloperData();
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      setError('Failed to create webhook');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'revoked': return 'bg-red-100 text-red-800';
      case 'disabled': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading developer dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
          <p className="text-gray-600">
            Manage your API keys, webhooks, and integrations
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={fetchDeveloperData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button asChild>
            <a href="/docs/api" target="_blank" rel="noopener noreferrer">
              <Book className="h-4 w-4 mr-2" />
              API Docs
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* New API Key Alert */}
      {newApiKey && (
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Your new API key has been created!</p>
              <p className="text-sm">Save this key securely - it will not be shown again.</p>
              <div className="flex items-center gap-2 p-2 bg-gray-100 rounded font-mono text-sm">
                <code className="flex-1">{newApiKey}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(newApiKey)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setNewApiKey(null)}
              >
                Got it
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">API Keys</p>
                  <p className="text-2xl font-bold">{analytics.summary.activeKeys}</p>
                </div>
                <Key className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Requests (24h)</p>
                  <p className="text-2xl font-bold">{analytics.analytics.totalRequests}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response</p>
                  <p className="text-2xl font-bold">{Math.round(analytics.analytics.avgResponseTime)}ms</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">{analytics.performance.successRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">API Keys</h3>
            <Button onClick={() => setShowNewKeyForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </div>

          {/* API Keys List */}
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <Card key={key.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{key.name}</h4>
                        <Badge className={getStatusColor(key.status)}>
                          {key.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Scopes: {key.scopes.join(', ')}</p>
                        <p>Rate Limit: {key.rateLimit.requestsPerMinute}/min, {key.rateLimit.requestsPerHour}/hour</p>
                        <p>Created: {formatDate(key.createdAt)}</p>
                        {key.lastUsedAt && <p>Last Used: {formatDate(key.lastUsedAt)}</p>}
                        {key.expiresAt && <p>Expires: {formatDate(key.expiresAt)}</p>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeAPIKey(key.id)}
                        disabled={key.status === 'revoked'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {apiKeys.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No API Keys
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first API key to start using the 209 Works API
                  </p>
                  <Button onClick={() => setShowNewKeyForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create API Key
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Webhook Endpoints</h3>
            <Button onClick={() => setShowNewWebhookForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>

          {/* Webhooks List */}
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{webhook.url}</h4>
                        <Badge className={getStatusColor(webhook.status)}>
                          {webhook.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Events: {webhook.events.join(', ')}</p>
                        <p>Created: {formatDate(webhook.createdAt)}</p>
                        {webhook.lastDeliveryAt && <p>Last Delivery: {formatDate(webhook.lastDeliveryAt)}</p>}
                        {webhook.failureCount > 0 && (
                          <p className="text-red-600">Failures: {webhook.failureCount}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {webhooks.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Webhooks
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Set up webhooks to receive real-time notifications
                  </p>
                  <Button onClick={() => setShowNewWebhookForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Webhook
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <h3 className="text-lg font-semibold">API Analytics</h3>
          
          {analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request Volume</CardTitle>
                  <CardDescription>API requests over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.analytics.totalRequests}</div>
                  <p className="text-sm text-gray-600">requests in the last 24 hours</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                  <CardDescription>Response time metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{Math.round(analytics.analytics.avgResponseTime)}ms</div>
                  <p className="text-sm text-gray-600">average response time</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Analytics Data
                </h3>
                <p className="text-gray-600">
                  Start making API requests to see analytics
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <h3 className="text-lg font-semibold">API Documentation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Learn the basics of the 209 Works API</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a href="/docs/api/getting-started" target="_blank">
                    <Book className="h-4 w-4 mr-2" />
                    View Guide
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Reference</CardTitle>
                <CardDescription>Complete API endpoint documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a href="/docs/api/reference" target="_blank">
                    <Code className="h-4 w-4 mr-2" />
                    API Reference
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
