'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';

interface InstagramPostAdProps {
  maxAds?: number;
  userLocation?: string;
  className?: string;
  showEngagement?: boolean;
}

interface Advertisement {
  id: string;
  name: string;
  content: {
    title: string;
    description?: string;
    imageUrl?: string;
    targetUrl: string;
    businessName: string;
  };
  targeting?: {
    zipCodes?: string[];
  };
}

export default function InstagramPostAd({
  maxAds = 1,
  userLocation,
  className = '',
  showEngagement = true,
}: InstagramPostAdProps) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<{ [key: string]: boolean }>({});
  const [saved, setSaved] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchAds();
  }, [userLocation]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        placement: 'social',
        limit: maxAds.toString(),
        ...(userLocation && { location: userLocation }),
      });

      const response = await fetch(`/api/ads/display?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAds(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load Instagram ads:', err);
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
          sessionId: `instagram_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          page: window.location.pathname,
          position: 'instagram-post',
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
          sessionId: `instagram_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

  const handleLike = (adId: string) => {
    setLiked(prev => ({ ...prev, [adId]: !prev[adId] }));
  };

  const handleSave = (adId: string) => {
    setSaved(prev => ({ ...prev, [adId]: !prev[adId] }));
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
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center p-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="aspect-square bg-gray-200"></div>
          <div className="p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (ads.length === 0) {
    return null;
  }

  const renderInstagramAd = (ad: Advertisement) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {ad.content.businessName.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <div className="font-semibold text-sm">{ad.content.businessName}</div>
            <div className="text-xs text-gray-500">Sponsored</div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Image */}
      <div className="aspect-square relative">
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
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-2xl text-gray-500">
                  {ad.content.businessName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-gray-500 text-sm">{ad.content.businessName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {showEngagement && (
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => handleLike(ad.id)}
              className={`transition-colors ${liked[ad.id] ? 'text-red-500' : 'text-gray-700 hover:text-gray-900'}`}
            >
              <Heart className={`h-6 w-6 ${liked[ad.id] ? 'fill-current' : ''}`} />
            </button>
            <button className="text-gray-700 hover:text-gray-900">
              <MessageCircle className="h-6 w-6" />
            </button>
            <button className="text-gray-700 hover:text-gray-900">
              <Send className="h-6 w-6" />
            </button>
          </div>
          <button 
            onClick={() => handleSave(ad.id)}
            className={`transition-colors ${saved[ad.id] ? 'text-gray-900' : 'text-gray-700 hover:text-gray-900'}`}
          >
            <Bookmark className={`h-6 w-6 ${saved[ad.id] ? 'fill-current' : ''}`} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-4">
        {showEngagement && (
          <div className="text-sm font-semibold mb-2">
            {Math.floor(Math.random() * 1000) + 100} likes
          </div>
        )}
        
        <div className="text-sm">
          <span className="font-semibold">{ad.content.businessName}</span>
          {' '}
          <span 
            className="cursor-pointer hover:text-blue-600"
            onClick={() => handleAdClick(ad)}
          >
            {ad.content.title}
          </span>
          {ad.content.description && (
            <>
              <br />
              <span className="text-gray-600">{ad.content.description}</span>
            </>
          )}
        </div>

        {/* Call to Action */}
        <button
          onClick={() => handleAdClick(ad)}
          className="mt-3 w-full bg-blue-500 text-white py-2 px-4 rounded-md font-medium text-sm hover:bg-blue-600 transition-colors"
        >
          Learn More
        </button>

        {/* Location */}
        {ad.targeting?.zipCodes && (
          <div className="text-xs text-gray-500 mt-2">
            📍 Serving {ad.targeting.zipCodes.join(', ')}
          </div>
        )}

        {showEngagement && (
          <div className="text-xs text-gray-500 mt-2">
            {Math.floor(Math.random() * 24) + 1} hours ago
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {ads.map((ad) => (
        <div key={ad.id}>
          {renderInstagramAd(ad)}
        </div>
      ))}
    </div>
  );
} 