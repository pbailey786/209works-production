'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Eye, 
  ExternalLink,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Target,
  X
} from 'lucide-react';

interface AdPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: {
    id: string;
    title: string;
    businessName: string;
    imageUrl: string;
    targetUrl: string;
    zipCodes: string;
    startDate: Date;
    endDate: Date;
    budget?: number;
    type?: string;
    description?: string;
  };
}

export default function AdPreviewModal({ isOpen, onClose, ad }: AdPreviewModalProps) {
  const [selectedDevice, setSelectedDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedPlacement, setSelectedPlacement] = useState<'banner' | 'sidebar' | 'native' | 'search'>('banner');

  const getDeviceClass = () => {
    switch (selectedDevice) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      default:
        return 'max-w-6xl mx-auto';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAdStatus = () => {
    const now = new Date();
    const start = new Date(ad.startDate);
    const end = new Date(ad.endDate);
    
    if (start > now) {
      return { status: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
    } else if (end < now) {
      return { status: 'expired', label: 'Expired', color: 'bg-gray-100 text-gray-800' };
    } else {
      return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-800' };
    }
  };

  const renderBannerAd = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center p-4">
        <div className="flex-shrink-0 mr-4">
          {ad.imageUrl ? (
            <img 
              src={ad.imageUrl} 
              alt={ad.title}
              className="w-16 h-16 rounded object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
              <Building className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{ad.title}</h3>
          <p className="text-gray-600 mb-2">{ad.businessName}</p>
          {ad.description && (
            <p className="text-sm text-gray-500 mb-2 line-clamp-2">{ad.description}</p>
          )}
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{ad.zipCodes}</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            Learn More
          </Button>
        </div>
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Sponsored</span>
          <a 
            href={ad.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-blue-600"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Visit Website
          </a>
        </div>
      </div>
    </div>
  );

  const renderSidebarAd = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm max-w-xs">
      <div className="aspect-square">
        {ad.imageUrl ? (
          <img 
            src={ad.imageUrl} 
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Building className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{ad.title}</h3>
        <p className="text-sm text-gray-600 mb-2">{ad.businessName}</p>
        {ad.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-3">{ad.description}</p>
        )}
        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
          Learn More
        </Button>
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <span className="text-xs text-gray-500">Sponsored</span>
      </div>
    </div>
  );

  const renderNativeAd = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {ad.imageUrl ? (
              <img 
                src={ad.imageUrl} 
                alt={ad.title}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                <Building className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{ad.title}</h3>
              <Badge variant="secondary" className="text-xs">Sponsored</Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">{ad.businessName}</p>
            {ad.description && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{ad.description}</p>
            )}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center text-xs text-gray-500">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{ad.zipCodes}</span>
              </div>
              <Button size="sm" variant="outline" className="text-xs">
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSearchAd = () => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
          Sponsored Result
        </Badge>
        <span className="text-xs text-gray-500">Ad</span>
      </div>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {ad.imageUrl ? (
            <img 
              src={ad.imageUrl} 
              alt={ad.title}
              className="w-16 h-16 rounded object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
              <Building className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
            {ad.title}
          </h3>
          <p className="text-green-600 text-sm mb-1">{ad.targetUrl}</p>
          <p className="text-gray-700 text-sm mb-2">{ad.businessName}</p>
          {ad.description && (
            <p className="text-gray-600 text-sm line-clamp-2">{ad.description}</p>
          )}
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span>Serving {ad.zipCodes}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdPreview = () => {
    switch (selectedPlacement) {
      case 'sidebar':
        return renderSidebarAd();
      case 'native':
        return renderNativeAd();
      case 'search':
        return renderSearchAd();
      default:
        return renderBannerAd();
    }
  };

  const adStatus = getAdStatus();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Advertisement Preview</DialogTitle>
              <DialogDescription>
                Preview how your advertisement will appear across different devices and placements
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Ad Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge className={adStatus.color}>
                {adStatus.label}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Campaign Period</p>
              <p className="font-medium text-sm">
                {formatDate(ad.startDate)} - {formatDate(ad.endDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Target Areas</p>
              <p className="font-medium text-sm">{ad.zipCodes}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Budget</p>
              <p className="font-medium text-sm">
                {ad.budget ? formatCurrency(ad.budget) : 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Device and Placement Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Device Preview
            </label>
            <div className="flex space-x-2">
              <Button
                variant={selectedDevice === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDevice('desktop')}
              >
                <Monitor className="h-4 w-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={selectedDevice === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDevice('tablet')}
              >
                <Tablet className="h-4 w-4 mr-2" />
                Tablet
              </Button>
              <Button
                variant={selectedDevice === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDevice('mobile')}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile
              </Button>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ad Placement
            </label>
            <div className="flex space-x-2">
              <Button
                variant={selectedPlacement === 'banner' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlacement('banner')}
              >
                Banner
              </Button>
              <Button
                variant={selectedPlacement === 'sidebar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlacement('sidebar')}
              >
                Sidebar
              </Button>
              <Button
                variant={selectedPlacement === 'native' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlacement('native')}
              >
                Native
              </Button>
              <Button
                variant={selectedPlacement === 'search' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlacement('search')}
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className={`transition-all duration-300 ${getDeviceClass()}`}>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                  {selectedPlacement.charAt(0).toUpperCase() + selectedPlacement.slice(1)} Ad Preview
                </h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Eye className="h-4 w-4 mr-1" />
                  {selectedDevice.charAt(0).toUpperCase() + selectedDevice.slice(1)} View
                </div>
              </div>
              
              {/* Mock website context */}
              <div className="bg-white rounded border border-gray-200 p-4 mb-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                
                {selectedPlacement === 'banner' && (
                  <div className="mb-4">
                    {renderAdPreview()}
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-3">
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                      
                      {selectedPlacement === 'native' && (
                        <div className="my-4">
                          {renderAdPreview()}
                        </div>
                      )}
                      
                      {selectedPlacement === 'search' && (
                        <div className="my-4">
                          {renderAdPreview()}
                        </div>
                      )}
                      
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                  
                  {selectedPlacement === 'sidebar' && (
                    <div className="lg:col-span-1">
                      {renderAdPreview()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Target className="h-4 w-4" />
            <span>Preview shows approximate appearance</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button asChild>
              <a 
                href={ad.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Target URL
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 