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
  userId,
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
          sessionId:
            sessionId ||
            `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
          sessionId:
            sessionId ||
            `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        <div className="h-32 rounded-lg bg-gray-200"></div>
      </div>
    );
  }

  if (error || ads.length === 0) {
    return null; // Don't show anything if no ads or error
  }

  const renderBannerAd = (ad: Advertisement) => (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center p-4">
        <div className="mr-4 flex-shrink-0">
          {ad.content.imageUrl ? (
            <img
              src={ad.content.imageUrl}
              alt={ad.content.title}
              className="h-16 w-16 rounded object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-200">
              <Building className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="mb-1 text-lg font-semibold text-gray-900">
            {ad.content.title}
          </h3>
          <p className="mb-2 text-gray-600">{ad.content.businessName}</p>
          {ad.content.description && (
            <p className="mb-2 line-clamp-2 text-sm text-gray-500">
              {ad.content.description}
            </p>
          )}
          {ad.targeting?.zipCodes && (
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="mr-1 h-4 w-4" />
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
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Sponsored</span>
          <button
            onClick={() => handleAdClick(ad)}
            className="flex items-center transition-colors hover:text-blue-600"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Visit Website
          </button>
        </div>
      </div>
    </div>
  );

  const renderSidebarAd = (ad: Advertisement) => (
    <div className="max-w-xs overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="aspect-square">
        {ad.content.imageUrl ? (
          <img
            src={ad.content.imageUrl}
            alt={ad.content.title}
            className="h-full w-full cursor-pointer object-cover"
            onClick={() => handleAdClick(ad)}
          />
        ) : (
          <div
            className="flex h-full w-full cursor-pointer items-center justify-center bg-gray-200"
            onClick={() => handleAdClick(ad)}
          >
            <Building className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900">
          {ad.content.title}
        </h3>
        <p className="mb-2 text-sm text-gray-600">{ad.content.businessName}</p>
        {ad.content.description && (
          <p className="mb-3 line-clamp-3 text-xs text-gray-500">
            {ad.content.description}
          </p>
        )}
        <Button
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={() => handleAdClick(ad)}
        >
          Learn More
        </Button>
      </div>
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
        <span className="text-xs text-gray-500">Sponsored</span>
      </div>
    </div>
  );

  const renderNativeAd = (ad: Advertisement) => (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {ad.content.imageUrl ? (
              <img
                src={ad.content.imageUrl}
                alt={ad.content.title}
                className="h-12 w-12 cursor-pointer rounded object-cover"
                onClick={() => handleAdClick(ad)}
              />
            ) : (
              <div
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded bg-gray-200"
                onClick={() => handleAdClick(ad)}
              >
                <Building className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3
                className="line-clamp-1 cursor-pointer text-sm font-medium text-gray-900 hover:text-blue-600"
                onClick={() => handleAdClick(ad)}
              >
                {ad.content.title}
              </h3>
              <Badge variant="secondary" className="text-xs">
                Sponsored
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {ad.content.businessName}
            </p>
            {ad.content.description && (
              <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                {ad.content.description}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between">
              {ad.targeting?.zipCodes && (
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin className="mr-1 h-3 w-3" />
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
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 transition-colors hover:bg-yellow-100">
      <div className="mb-2 flex items-center justify-between">
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-xs text-yellow-800"
        >
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
              className="h-16 w-16 cursor-pointer rounded object-cover"
              onClick={() => handleAdClick(ad)}
            />
          ) : (
            <div
              className="flex h-16 w-16 cursor-pointer items-center justify-center rounded bg-gray-200"
              onClick={() => handleAdClick(ad)}
            >
              <Building className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3
            className="cursor-pointer text-lg font-semibold text-blue-600 hover:text-blue-800"
            onClick={() => handleAdClick(ad)}
          >
            {ad.content.title}
          </h3>
          <p className="mb-1 text-sm text-green-600">{ad.content.targetUrl}</p>
          <p className="mb-2 text-sm text-gray-700">
            {ad.content.businessName}
          </p>
          {ad.content.description && (
            <p className="line-clamp-2 text-sm text-gray-600">
              {ad.content.description}
            </p>
          )}
          {ad.targeting?.zipCodes && (
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <MapPin className="mr-1 h-4 w-4" />
              <span>Serving {ad.targeting.zipCodes.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderFeaturedAd = (ad: Advertisement) => (
    <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4 transition-colors hover:from-blue-100 hover:to-purple-100">
      <div className="mb-3 flex items-center justify-between">
        <Badge className="bg-blue-100 text-blue-800">Featured Business</Badge>
        <span className="text-xs text-gray-500">Sponsored</span>
      </div>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {ad.content.imageUrl ? (
            <img
              src={ad.content.imageUrl}
              alt={ad.content.title}
              className="h-20 w-20 cursor-pointer rounded-lg object-cover"
              onClick={() => handleAdClick(ad)}
            />
          ) : (
            <div
              className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg bg-white shadow-sm"
              onClick={() => handleAdClick(ad)}
            >
              <Building className="h-10 w-10 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3
            className="mb-2 cursor-pointer text-xl font-bold text-gray-900 hover:text-blue-600"
            onClick={() => handleAdClick(ad)}
          >
            {ad.content.title}
          </h3>
          <p className="mb-2 font-medium text-gray-700">
            {ad.content.businessName}
          </p>
          {ad.content.description && (
            <p className="mb-3 line-clamp-2 text-sm text-gray-600">
              {ad.content.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            {ad.targeting?.zipCodes && (
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="mr-1 h-4 w-4" />
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
      {ads.map(ad => (
        <div key={ad.id}>{renderAd(ad)}</div>
      ))}
    </div>
  );
}
