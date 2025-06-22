'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  ArrowLeft,
  Mail
} from 'lucide-react';
import Link from 'next/link';

interface TestType {
  id: string;
  name: string;
  description: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function TestEmailPage() {
  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTestType, setSelectedTestType] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customProps, setCustomProps] = useState('{}');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  // Load test options on component mount
  useEffect(() => {
    const loadTestOptions = async () => {
      try {
        const response = await fetch('/api/admin/email/test');
        const data = await response.json();
        
        if (data.success) {
          setTestTypes(data.data.testTypes);
          setTemplates(data.data.templates);
        }
      } catch (error) {
        console.error('Failed to load test options:', error);
      }
    };

    loadTestOptions();
  }, []);

  const handleSendTest = async () => {
    if (!recipientEmail) {
      setResult({ success: false, error: 'Please enter a recipient email address' });
      return;
    }

    if (!selectedTestType) {
      setResult({ success: false, error: 'Please select a test type' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      let templateProps = {};
      
      // Parse custom props if provided
      if (customProps.trim() !== '{}') {
        try {
          templateProps = JSON.parse(customProps);
        } catch (error) {
          setResult({ success: false, error: 'Invalid JSON in custom properties' });
          setIsLoading(false);
          return;
        }
      }

      const payload = {
        testType: selectedTestType,
        recipientEmail,
        templateProps,
        ...(selectedTestType === 'template' && { templateId: selectedTemplate }),
      };

      const response = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({ 
          success: true, 
          message: `Test email sent successfully! Message ID: ${data.messageId}` 
        });
      } else {
        setResult({ 
          success: false, 
          error: data.error || 'Failed to send test email' 
        });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        error: 'Network error: Failed to send test email' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'job_seeker': return 'bg-blue-50 text-blue-700';
      case 'employer': return 'bg-purple-50 text-purple-700';
      case 'system': return 'bg-gray-50 text-gray-700';
      case 'marketing': return 'bg-orange-50 text-orange-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/email">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Email Management
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Test Email System</h1>
          <p className="text-muted-foreground">
            Send test emails to verify templates and delivery configuration
          </p>
        </div>
        <TestTube className="h-8 w-8 text-muted-foreground" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Configure and send test emails to verify your email system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipient Email */}
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input
                id="recipient"
                type="email"
                placeholder="test@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            {/* Test Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="test-type">Test Type</Label>
              <Select value={selectedTestType} onValueChange={setSelectedTestType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  {testTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Selection (only for template test type) */}
            {selectedTestType === 'template' && (
              <div className="space-y-2">
                <Label htmlFor="template">Email Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center space-x-2">
                          <span>{template.name}</span>
                          <Badge variant="outline" className={getCategoryColor(template.category)}>
                            {template.category.replace('_', ' ')}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Properties */}
            <div className="space-y-2">
              <Label htmlFor="props">Custom Properties (JSON)</Label>
              <Textarea
                id="props"
                placeholder='{"userName": "Test User", "userType": "job_seeker"}'
                value={customProps}
                onChange={(e) => setCustomProps(e.target.value)}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Optional: Override default template properties with custom values
              </p>
            </div>

            {/* Send Button */}
            <Button 
              onClick={handleSendTest} 
              disabled={isLoading || !recipientEmail || !selectedTestType}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Test Email...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>

            {/* Result Display */}
            {result && (
              <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className="ml-2">
                    {result.success ? result.message : result.error}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Available Test Types */}
        <Card>
          <CardHeader>
            <CardTitle>Available Test Types</CardTitle>
            <CardDescription>
              Different types of emails you can test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testTypes.map((type) => (
                <div 
                  key={type.id} 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTestType === type.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTestType(type.id)}
                >
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{type.name}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Templates Info */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Email Templates</CardTitle>
            <CardDescription>
              Templates available for testing when using "Template" test type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge variant="outline" className={getCategoryColor(template.category)}>
                      {template.category.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
