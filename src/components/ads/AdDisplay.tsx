'use client';

import { useState, useEffect } from 'react';
import { Building, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Advertisement {
  id: string;
  name: string;
  type: string;
  status: string;
  content: {
    title: string;
    description?: string;
    imageUrl?: string;
    targetUrl: string;
    businessName: string;
  };
  targeting?: {
    zipCodes?: string[];
    demographics?: any;
  };
  bidding: {
    type: string;
    bidAmount: number;
  };
  schedule: {
    startDate: string;
    endDate: string;
  };
}

interface AdDisplayProps {
  placement: 'banner' | 'sidebar' | 'native' | 'search' | 'featured';
  className?: string;
  maxAds?: number;
  userLocation?: string;
  sessionId?: string;
  userId?: string;
}

export default function AdDisplay({ 
  placement, 
  className = '', 
  maxAds = 1,
  userLocation,
  sessionId,
  userId 
}: AdDisplayProps) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAds();
  }, [placement, userLocation]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        placement,
        limit: maxAds.toString(),
        ...(userLocation && { location: userLocation }),
      });

      const response = await fetch(`/api/ads/display?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAds(data.data || []);
      } else {
        setError(data.error || 'Failed to load ads');
      }
    } catch (err) {
      setError('Failed to load ads');
      console.error('Ad fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const trackImpression = async (adId: string) => {
    try {
      await fetch('/api/ads/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId,
          userId,
          sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          page: window.location.pathname,
          position: placement,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }),
      });
    } catch (err) {
      console.error('Failed to track impression:', err);
    }
  };

  const trackClick = async (adId: string, targetUrl: string) => {
    try {
      await fetch('/api/ads/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId,
          userId,
          sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          targetUrl,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }),
      });
    } catch (err) {
      console.error('Failed to track click:', err);
    }
  };

  const handleAdClick = async (ad: Advertisement) => {
    await trackClick(ad.id, ad.content.targetUrl);
    window.open(ad.content.targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Track impressions when ads are loaded
  useEffect(() => {
    if (ads.length > 0) {
      ads.forEach(ad => trackImpression(ad.id));
    }
  }, [ads]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 rounded-lg h-32"></div>
      </div>
    );
  }

  if (error || ads.length === 0) {
    return null; // Don't show anything if no ads or error
  }

  const renderBannerAd = (ad: Advertisement) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center p-4">
        <div className="flex-shrink-0 mr-4">
          {ad.content.imageUrl ? (
            <img 
              src={ad.content.imageUrl} 
              alt={ad.content.title}
              className="w-16 h-16 rounded object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
              <Building className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{ad.content.title}</h3>
          <p className="text-gray-600 mb-2">{ad.content.businessName}</p>
          {ad.content.description && (
            <p className="text-sm text-gray-500 mb-2 line-clamp-2">{ad.content.description}</p>
          )}
          {ad.targeting?.zipCodes && (
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-1" />
              <span>Serving {ad.targeting.zipCodes.join(', ')}</span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => handleAdClick(ad)}
          >
            Learn More
          </Button>
        </div>
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Sponsored</span>
          <button 
            onClick={() => handleAdClick(ad)}
            className="flex items-center hover:text-blue-600 transition-colors"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Visit Website
          </button>
        </div>
      </div>
    </div>
  );

  const renderSidebarAd = (ad: Advertisement) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow max-w-xs">
      <div className="aspect-square">
        {ad.content.imageUrl ? (
          <img 
            src={ad.content.imageUrl} 
            alt={ad.content.title}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => handleAdClick(ad)}
          />
        ) : (
          <div 
            className="w-full h-full bg-gray-200 flex items-center justify-center cursor-pointer"
            onClick={() => handleAdClick(ad)}
          >
            <Building className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{ad.content.title}</h3>
        <p className="text-sm text-gray-600 mb-2">{ad.content.businessName}</p>
        {ad.content.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-3">{ad.content.description}</p>
        )}
        <Button 
          size="sm" 
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={() => handleAdClick(ad)}
        >
          Learn More
        </Button>
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <span className="text-xs text-gray-500">Sponsored</span>
      </div>
    </div>
  );

  const renderNativeAd = (ad: Advertisement) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {ad.content.imageUrl ? (
              <img 
                src={ad.content.imageUrl} 
                alt={ad.content.title}
                className="w-12 h-12 rounded object-cover cursor-pointer"
                onClick={() => handleAdClick(ad)}
              />
            ) : (
              <div 
                className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center cursor-pointer"
                onClick={() => handleAdClick(ad)}
              >
                <Building className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 
                className="text-sm font-medium text-gray-900 line-clamp-1 cursor-pointer hover:text-blue-600"
                onClick={() => handleAdClick(ad)}
              >
                {ad.content.title}
              </h3>
              <Badge variant="secondary" className="text-xs">Sponsored</Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">{ad.content.businessName}</p>
            {ad.content.description && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{ad.content.description}</p>
            )}
            <div className="flex items-center justify-between mt-3">
              {ad.targeting?.zipCodes && (
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{ad.targeting.zipCodes.join(', ')}</span>
                </div>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={() => handleAdClick(ad)}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSearchAd = (ad: Advertisement) => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:bg-yellow-100 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
          Sponsored Result
        </Badge>
        <span className="text-xs text-gray-500">Ad</span>
      </div>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {ad.content.imageUrl ? (
            <img 
              src={ad.content.imageUrl} 
              alt={ad.content.title}
              className="w-16 h-16 rounded object-cover cursor-pointer"
              onClick={() => handleAdClick(ad)}
            />
          ) : (
            <div 
              className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center cursor-pointer"
              onClick={() => handleAdClick(ad)}
            >
              <Building className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 
            className="text-lg font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            onClick={() => handleAdClick(ad)}
          >
            {ad.content.title}
          </h3>
          <p className="text-green-600 text-sm mb-1">{ad.content.targetUrl}</p>
          <p className="text-gray-700 text-sm mb-2">{ad.content.businessName}</p>
          {ad.content.description && (
            <p className="text-gray-600 text-sm line-clamp-2">{ad.content.description}</p>
          )}
          {ad.targeting?.zipCodes && (
            <div className="flex items-center text-sm text-gray-500 mt-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span>Serving {ad.targeting.zipCodes.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderFeaturedAd = (ad: Advertisement) => (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 hover:from-blue-100 hover:to-purple-100 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <Badge className="bg-blue-100 text-blue-800">Featured Business</Badge>
        <span className="text-xs text-gray-500">Sponsored</span>
      </div>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {ad.content.imageUrl ? (
            <img 
              src={ad.content.imageUrl} 
              alt={ad.content.title}
              className="w-20 h-20 rounded-lg object-cover cursor-pointer"
              onClick={() => handleAdClick(ad)}
            />
          ) : (
            <div 
              className="w-20 h-20 bg-white rounded-lg flex items-center justify-center cursor-pointer shadow-sm"
              onClick={() => handleAdClick(ad)}
            >
              <Building className="h-10 w-10 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 
            className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
            onClick={() => handleAdClick(ad)}
          >
            {ad.content.title}
          </h3>
          <p className="text-gray-700 font-medium mb-2">{ad.content.businessName}</p>
          {ad.content.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ad.content.description}</p>
          )}
          <div className="flex items-center justify-between">
            {ad.targeting?.zipCodes && (
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                <span>Serving {ad.targeting.zipCodes.join(', ')}</span>
              </div>
            )}
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => handleAdClick(ad)}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAd = (ad: Advertisement) => {
    switch (placement) {
      case 'sidebar':
        return renderSidebarAd(ad);
      case 'native':
        return renderNativeAd(ad);
      case 'search':
        return renderSearchAd(ad);
      case 'featured':
        return renderFeaturedAd(ad);
      default:
        return renderBannerAd(ad);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {ads.map((ad) => (
        <div key={ad.id}>
          {renderAd(ad)}
        </div>
      ))}
    </div>
  );
} 