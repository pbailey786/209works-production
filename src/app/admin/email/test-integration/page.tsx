'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Mail, Send, Loader2 } from 'lucide-react';

const emailTests = [
  {
    id: 'welcome_job_seeker',
    name: 'Welcome Email (Job Seeker)',
    description: 'Test the welcome email sent to new job seekers',
  },
  {
    id: 'welcome_employer',
    name: 'Welcome Email (Employer)',
    description: 'Test the welcome email sent to new employers',
  },
  {
    id: 'password_reset',
    name: 'Password Reset Email',
    description: 'Test the password reset email with secure link',
  },
  {
    id: 'application_confirmation',
    name: 'Job Application Confirmation',
    description: 'Test the email sent when someone applies to a job',
  },
  {
    id: 'job_alert',
    name: 'Job Alert Email',
    description: 'Test job alert email with sample job listings',
  },
  {
    id: 'weekly_digest',
    name: 'Weekly Digest Email',
    description: 'Test the weekly digest email with user stats',
  },
];

export default function EmailTestIntegrationPage() {
  // TODO: Replace with Clerk authentication
  const session = { user: { email: 'admin@209.works', sub: 'mock-user-id' } }; // Mock session
  const [selectedTest, setSelectedTest] = useState('');
  const [recipientEmail, setRecipientEmail] = useState(session?.user?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    success: boolean;
    error?: string;
    message?: string;
    testName: string;
    id: number;
    timestamp?: string;
    recipientEmail?: string;
  }>>([]);

  const runTest = async () => {
    if (!selectedTest || !recipientEmail) {
      alert('Please select a test type and enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/email/test-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testType: selectedTest,
          recipientEmail,
        }),
      });

      const result = await response.json();
      
      setTestResults(prev => [
        {
          ...result,
          id: Date.now(),
          testName: emailTests.find(t => t.id === selectedTest)?.name || selectedTest,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      if (result.success) {
        alert(`✅ Test email sent successfully! Check ${recipientEmail} for the email.`);
      } else {
        alert(`❌ Test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      alert('❌ Failed to run test. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    if (!recipientEmail) {
      alert('Please enter an email address');
      return;
    }

    setIsLoading(true);
    const results: Array<{
      success: boolean;
      error?: string;
      message?: string;
      testName: string;
      id: number;
      timestamp?: string;
      recipientEmail?: string;
    }> = [];

    for (const test of emailTests) {
      try {
        const response = await fetch('/api/email/test-integration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            testType: test.id,
            recipientEmail,
          }),
        });

        const result = await response.json();
        results.push({
          ...result,
          id: Date.now() + Math.random(),
          testName: test.name,
          timestamp: new Date().toISOString(),
        });

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          testName: test.name,
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
        });
      }
    }

    setTestResults(prev => [...results, ...prev]);
    setIsLoading(false);
    
    const successCount = results.filter(r => r.success).length;
    alert(`✅ Completed ${successCount}/${emailTests.length} tests successfully!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Integration Testing</h1>
        <p className="text-gray-600 mt-2">
          Test all email functionality to ensure everything is working correctly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Test Configuration
            </CardTitle>
            <CardDescription>
              Configure and run individual email tests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Recipient Email Address</Label>
              <Input
                id="email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Enter email to receive test emails"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Use your real email address to receive and verify the test emails
              </p>
            </div>

            <div>
              <Label htmlFor="test-type">Test Type</Label>
              <Select value={selectedTest} onValueChange={setSelectedTest}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an email test to run" />
                </SelectTrigger>
                <SelectContent>
                  {emailTests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTest && (
                <p className="text-sm text-gray-500 mt-1">
                  {emailTests.find(t => t.id === selectedTest)?.description}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={runTest} 
                disabled={isLoading || !selectedTest || !recipientEmail}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Run Selected Test
              </Button>
              
              <Button 
                onClick={runAllTests} 
                disabled={isLoading || !recipientEmail}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Run All Tests
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Available Email Tests</CardTitle>
            <CardDescription>
              All email types that can be tested
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emailTests.map((test) => (
                <div 
                  key={test.id} 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTest === test.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTest(test.id)}
                >
                  <h4 className="font-medium">{test.name}</h4>
                  <p className="text-sm text-gray-600">{test.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Results from recent email tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result) => (
                <Alert key={result.id} className={result.success ? 'border-green-200' : 'border-red-200'}>
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{result.testName}</h4>
                        <span className="text-sm text-gray-500">
                          {result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : 'Unknown time'}
                        </span>
                      </div>
                      <AlertDescription className="mt-1">
                        {result.message || result.error}
                      </AlertDescription>
                      {result.recipientEmail && (
                        <p className="text-sm text-gray-500 mt-1">
                          Sent to: {result.recipientEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
