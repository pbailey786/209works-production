/**
 * GDPR-Compliant Consent Banner
 * Handles user consent for analytics tracking with regional context
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cookie, 
  Shield, 
  Settings, 
  X, 
  ChevronDown, 
  ChevronUp,
  Info,
  MapPin
} from 'lucide-react';
import { usePostHog } from '@/lib/analytics/posthog-provider';

interface ConsentBannerProps {
  region?: string;
  className?: string;
}

export default function ConsentBanner({ region, className = '' }: ConsentBannerProps) {
  const { hasConsent, grantConsent, revokeConsent } = usePostHog();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consentDecision, setConsentDecision] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has already made a consent decision
    const existingConsent = localStorage.getItem('posthog-consent');
    setConsentDecision(existingConsent);
    
    // Show banner if no decision has been made
    if (!existingConsent) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    grantConsent();
    setConsentDecision('granted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    revokeConsent();
    setConsentDecision('revoked');
    setIsVisible(false);
  };

  const handleManagePreferences = () => {
    setShowDetails(!showDetails);
  };

  const getRegionalPrivacyInfo = () => {
    const regionalInfo = {
      '209': {
        name: 'Central Valley',
        laws: 'CCPA (California Consumer Privacy Act)',
        rights: 'Right to know, delete, and opt-out of sale of personal information'
      },
      '916': {
        name: 'Sacramento Metro',
        laws: 'CCPA (California Consumer Privacy Act)',
        rights: 'Right to know, delete, and opt-out of sale of personal information'
      },
      '510': {
        name: 'East Bay',
        laws: 'CCPA (California Consumer Privacy Act)',
        rights: 'Right to know, delete, and opt-out of sale of personal information'
      },
      'norcal': {
        name: 'Northern California',
        laws: 'CCPA (California Consumer Privacy Act)',
        rights: 'Right to know, delete, and opt-out of sale of personal information'
      }
    };

    return regionalInfo[region as keyof typeof regionalInfo] || {
      name: 'Your Region',
      laws: 'GDPR and CCPA',
      rights: 'Right to access, rectify, erase, and port your data'
    };
  };

  const regionalInfo = getRegionalPrivacyInfo();

  if (!isVisible && consentDecision !== 'granted') {
    return null;
  }

  // Show minimal indicator if consent was granted
  if (consentDecision === 'granted' && hasConsent) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Card className="bg-green-50 border-green-200 shadow-lg">
          <CardContent className="p-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800">Analytics enabled</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(true)}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 ${className}`}>
      <Card className="max-w-4xl mx-auto bg-white border shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Cookie className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  We value your privacy
                </h3>
                {region && (
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    {regionalInfo.name}
                  </Badge>
                )}
              </div>
              
              <p className="text-gray-600 mb-4">
                We use analytics to improve your job search experience and provide regional insights. 
                Your data helps us understand how people find jobs in {regionalInfo.name} and optimize our platform.
              </p>

              {showDetails && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">What we track:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Job searches and views (to improve search results)</li>
                      <li>• Regional preferences (to show relevant opportunities)</li>
                      <li>• Application patterns (to optimize the application process)</li>
                      <li>• Page navigation (to improve user experience)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Your rights under {regionalInfo.laws}:</h4>
                    <p className="text-sm text-gray-600">{regionalInfo.rights}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Data protection:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• No personal information is sold to third parties</li>
                      <li>• Data is anonymized and aggregated for insights</li>
                      <li>• You can opt-out at any time</li>
                      <li>• Regional data stays within appropriate jurisdictions</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleAccept}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Accept Analytics
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleDecline}
                  className="border-gray-300"
                >
                  Decline
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={handleManagePreferences}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Info className="w-4 h-4 mr-2" />
                  {showDetails ? 'Hide Details' : 'Learn More'}
                  {showDetails ? (
                    <ChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                By accepting, you agree to our use of analytics cookies for improving your experience. 
                You can change your preferences at any time in your account settings.
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 