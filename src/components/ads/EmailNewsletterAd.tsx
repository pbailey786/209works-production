'use client';

import { useState, useEffect } from 'react';

interface EmailNewsletterAdProps {
  placement?: 'header' | 'footer' | 'inline';
  maxAds?: number;
  userLocation?: string;
  emailId?: string;
  recipientId?: string;
  generateHtml?: boolean; // For server-side email generation
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

export default function EmailNewsletterAd({
  placement = 'inline',
  maxAds = 1,
  userLocation,
  emailId,
  recipientId,
  generateHtml = false,
}: EmailNewsletterAdProps) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!generateHtml) {
      fetchAds();
    }
  }, [placement, userLocation, generateHtml]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        placement: 'email',
        limit: maxAds.toString(),
        ...(userLocation && { location: userLocation }),
      });

      const response = await fetch(`/api/ads/display?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAds(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load email ads:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTrackingUrl = (adId: string, targetUrl: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const trackingParams = new URLSearchParams({
      adId,
      targetUrl,
      ...(emailId && { emailId }),
      ...(recipientId && { recipientId }),
      source: 'email',
      placement,
    });
    
    return `${baseUrl}/api/ads/email-click?${trackingParams}`;
  };

  const generateImpressionPixel = (adId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const trackingParams = new URLSearchParams({
      adId,
      ...(emailId && { emailId }),
      ...(recipientId && { recipientId }),
      source: 'email',
      placement,
    });
    
    return `${baseUrl}/api/ads/email-impression?${trackingParams}`;
  };

  // Generate email-safe HTML for server-side rendering
  const generateEmailHtml = (ads: Advertisement[]) => {
    return ads.map(ad => {
      const trackingUrl = generateTrackingUrl(ad.id, ad.content.targetUrl);
      const impressionPixel = generateImpressionPixel(ad.id);
      
      return `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
          <tr>
            <td style="padding: 20px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: 10px;">
                    <span style="font-size: 12px; color: #6b7280; background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px;">Sponsored</span>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center;">
                    ${ad.content.imageUrl ? `
                      <a href="${trackingUrl}" style="text-decoration: none;">
                        <img src="${ad.content.imageUrl}" alt="${ad.content.title}" style="max-width: 200px; height: auto; border-radius: 4px; margin-bottom: 15px;" />
                      </a>
                    ` : ''}
                    <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #1f2937;">
                      <a href="${trackingUrl}" style="color: #1f2937; text-decoration: none;">${ad.content.title}</a>
                    </h3>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; font-weight: 500;">${ad.content.businessName}</p>
                    ${ad.content.description ? `
                      <p style="margin: 0 0 15px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">${ad.content.description}</p>
                    ` : ''}
                    <a href="${trackingUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">Learn More</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Tracking pixel -->
          <tr>
            <td>
              <img src="${impressionPixel}" alt="" width="1" height="1" style="display: block;" />
            </td>
          </tr>
        </table>
      `;
    }).join('');
  };

  if (generateHtml) {
    // Return HTML string for server-side email generation
    return null; // This would be used differently in email generation
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 rounded-lg h-32"></div>
      </div>
    );
  }

  if (ads.length === 0) {
    return null;
  }

  const renderEmailAd = (ad: Advertisement) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-4">
      <div className="text-center p-4">
        <div className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded mb-3">
          Sponsored
        </div>
        
        {ad.content.imageUrl && (
          <div className="mb-4">
            <img 
              src={ad.content.imageUrl} 
              alt={ad.content.title}
              className="max-w-[200px] h-auto rounded mx-auto"
            />
          </div>
        )}
        
        <h3 className="text-lg font-bold text-gray-900 mb-2">{ad.content.title}</h3>
        <p className="text-sm text-gray-600 font-medium mb-2">{ad.content.businessName}</p>
        
        {ad.content.description && (
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">{ad.content.description}</p>
        )}
        
        <a
          href={generateTrackingUrl(ad.id, ad.content.targetUrl)}
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium text-sm hover:bg-blue-700 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn More
        </a>
      </div>
      
      {/* Tracking pixel for web view */}
      <img 
        src={generateImpressionPixel(ad.id)} 
        alt="" 
        width="1" 
        height="1" 
        className="block"
        style={{ display: 'block' }}
      />
    </div>
  );

  return (
    <div className="email-newsletter-ads">
      {ads.map((ad) => (
        <div key={ad.id}>
          {renderEmailAd(ad)}
        </div>
      ))}
    </div>
  );
}

// Export function for server-side email generation
export const generateEmailNewsletterAdHtml = async (options: {
  placement?: string;
  maxAds?: number;
  userLocation?: string;
  emailId?: string;
  recipientId?: string;
}): Promise<string> => {
  try {
    const params = new URLSearchParams({
      placement: 'email',
      limit: (options.maxAds || 1).toString(),
      ...(options.userLocation && { location: options.userLocation }),
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/ads/display?${params}`);
    const data = await response.json();

    if (response.ok && data.data?.length > 0) {
      const ads = data.data;
      
      return ads.map((ad: Advertisement) => {
        const trackingUrl = `${baseUrl}/api/ads/email-click?${new URLSearchParams({
          adId: ad.id,
          targetUrl: ad.content.targetUrl,
          ...(options.emailId && { emailId: options.emailId }),
          ...(options.recipientId && { recipientId: options.recipientId }),
          source: 'email',
          placement: options.placement || 'inline',
        })}`;
        
        const impressionPixel = `${baseUrl}/api/ads/email-impression?${new URLSearchParams({
          adId: ad.id,
          ...(options.emailId && { emailId: options.emailId }),
          ...(options.recipientId && { recipientId: options.recipientId }),
          source: 'email',
          placement: options.placement || 'inline',
        })}`;
        
        return `
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
            <tr>
              <td style="padding: 20px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="text-align: center; padding-bottom: 10px;">
                      <span style="font-size: 12px; color: #6b7280; background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px;">Sponsored</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="text-align: center;">
                      ${ad.content.imageUrl ? `
                        <a href="${trackingUrl}" style="text-decoration: none;">
                          <img src="${ad.content.imageUrl}" alt="${ad.content.title}" style="max-width: 200px; height: auto; border-radius: 4px; margin-bottom: 15px;" />
                        </a>
                      ` : ''}
                      <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #1f2937;">
                        <a href="${trackingUrl}" style="color: #1f2937; text-decoration: none;">${ad.content.title}</a>
                      </h3>
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; font-weight: 500;">${ad.content.businessName}</p>
                      ${ad.content.description ? `
                        <p style="margin: 0 0 15px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">${ad.content.description}</p>
                      ` : ''}
                      <a href="${trackingUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">Learn More</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <img src="${impressionPixel}" alt="" width="1" height="1" style="display: block;" />
              </td>
            </tr>
          </table>
        `;
      }).join('');
    }
    
    return '';
  } catch (error) {
    console.error('Error generating email newsletter ad HTML:', error);
    return '';
  }
}; 