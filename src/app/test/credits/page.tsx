'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestCreditsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const addTestCredits = async (creditType: string, count: number) => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/test/add-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ creditType, count }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testJobOptimization = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/job-post-optimizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: 'Test Job',
          companyName: 'Test Company',
          location: 'Stockton, CA',
          pay: '$20/hour',
          schedule: 'Full-time',
          companyDescription: 'A test company',
          idealFit: 'Someone who likes testing',
          culture: 'Testing culture',
          growthPath: 'Testing growth',
          perks: 'Testing perks',
          applicationCTA: 'Apply now for testing',
          mediaUrls: [],
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Job optimization successful! ID: ${data.id}`);
      } else {
        setMessage(`❌ Job optimization failed: ${data.error}`);
        if (data.debug) {
          console.log('Debug info:', data.debug);
        }
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Credit System Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => addTestCredits('universal', 5)}
              disabled={isLoading}
            >
              Add 5 Universal Credits
            </Button>
            <Button
              onClick={() => addTestCredits('job_post', 3)}
              disabled={isLoading}
            >
              Add 3 Job Post Credits (Legacy)
            </Button>
          </div>
          
          <Button
            onClick={testJobOptimization}
            disabled={isLoading}
            className="w-full"
          >
            Test Job Optimization
          </Button>
          
          {message && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <p>{message}</p>
            </div>
          )}
          
          {isLoading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Processing...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
