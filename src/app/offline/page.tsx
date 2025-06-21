'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Check online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();

    // Get last sync time from localStorage
    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
      setLastSyncTime(new Date(lastSync));
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    
    // Try to reload the page
    if (isOnline) {
      window.location.href = '/';
    } else {
      // Show retry animation
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const offlineFeatures = [
    {
      icon: Bookmark,
      title: 'Saved Jobs',
      description: 'View your previously saved job listings',
      available: true
    },
    {
      icon: Search,
      title: 'Search History',
      description: 'Access your recent search queries',
      available: true
    },
    {
      icon: MessageSquare,
      title: 'JobsGPT Cache',
      description: 'View cached conversation history',
      available: true
    },
    {
      icon: Clock,
      title: 'Application History',
      description: 'Review your job application status',
      available: false
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Status indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
            isOnline ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isOnline ? (
              <Globe className="h-10 w-10 text-green-600" />
            ) : (
              <WifiOff className="h-10 w-10 text-red-600" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isOnline ? 'Connection Restored!' : 'You\'re Offline'}
          </h1>
          
          <p className="text-gray-600">
            {isOnline 
              ? 'Your internet connection has been restored. You can now access all features.'
              : 'Please check your internet connection. Some features are still available offline.'
            }
          </p>
          
          {/* Connection status badge */}
          <div className="mt-4">
            <Badge 
              variant={isOnline ? "default" : "destructive"}
              className="text-sm"
            >
              {isOnline ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Online
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
          </div>
        </motion.div>

        {/* Action buttons */}
        <div className="space-y-3">
          {isOnline ? (
            <Button
              onClick={handleGoHome}
              className="w-full"
              size="lg"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
          ) : (
            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${retryCount > 0 ? 'animate-spin' : ''}`} />
              Try Again {retryCount > 0 && `(${retryCount})`}
            </Button>
          )}
        </div>

        {/* Offline features */}
        {!isOnline && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Available Offline
              </CardTitle>
              <CardDescription>
                These features work without an internet connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {offlineFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        feature.available 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        feature.available 
                          ? 'bg-green-100' 
                          : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          feature.available 
                            ? 'text-green-600' 
                            : 'text-gray-400'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          feature.available 
                            ? 'text-green-900' 
                            : 'text-gray-500'
                        }`}>
                          {feature.title}
                        </h4>
                        <p className={`text-sm ${
                          feature.available 
                            ? 'text-green-700' 
                            : 'text-gray-400'
                        }`}>
                          {feature.description}
                        </p>
                      </div>
                      
                      <Badge 
                        variant={feature.available ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {feature.available ? 'Available' : 'Requires Internet'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Last sync info */}
        {lastSyncTime && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  Last synced: {lastSyncTime.toLocaleDateString()} at {lastSyncTime.toLocaleTimeString()}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips for offline usage */}
        {!isOnline && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Offline Tips</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Your saved jobs and search history are cached locally</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Job applications will be synced when you're back online</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Try moving to an area with better signal strength</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Check your WiFi or mobile data connection</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* App info */}
        <div className="text-center text-xs text-gray-500">
          <p>209 Works - Progressive Web App</p>
          <p>Version 1.0.0 • Built for the 209</p>
        </div>
      </div>
    </div>
  );
}
