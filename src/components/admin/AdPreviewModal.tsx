'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/dialog';
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

function AdPreviewModal({
  isOpen,
  onClose,
  ad
}: AdPreviewModalProps) {
  const [selectedDevice, setSelectedDevice] = useState<
    'desktop' | 'tablet' | 'mobile'
  >('desktop');
  const [selectedPlacement, setSelectedPlacement] = useState<
    'banner' | 'sidebar' | 'native' | 'search'
  >('banner');

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
      return {
        status: 'scheduled',
        label: 'Scheduled',
        color: 'bg-blue-100 text-blue-800'
      };
    } else if (end < now) {
      return {
        status: 'expired',
        label: 'Expired',
        color: 'bg-gray-100 text-gray-800'
      };
    } else {
      return {
        status: 'active',
        label: 'Active',
        color: 'bg-green-100 text-green-800'
      };
    }
  };

  const renderBannerAd = () => (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center p-4">
        <div className="mr-4 flex-shrink-0">
          {ad.imageUrl ? (
            <img
              src={ad.imageUrl}
              alt={ad.title}
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
            {ad.title}
          </h3>
          <p className="mb-2 text-gray-600">{ad.businessName}</p>
          {ad.description && (
            <p className="mb-2 line-clamp-2 text-sm text-gray-500">
              {ad.description}
            </p>
          )}
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="mr-1 h-4 w-4" />
            <span>{ad.zipCodes}</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            Learn More
          </Button>
        </div>
      </div>
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Sponsored</span>
          <a
            href={ad.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-blue-600"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Visit Website
          </a>
        </div>
      </div>
    </div>
  );

  const renderSidebarAd = () => (
    <div className="max-w-xs overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="aspect-square">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200">
            <Building className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900">
          {ad.title}
        </h3>
        <p className="mb-2 text-sm text-gray-600">{ad.businessName}</p>
        {ad.description && (
          <p className="mb-3 line-clamp-3 text-xs text-gray-500">
            {ad.description}
          </p>
        )}
        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
          Learn More
        </Button>
      </div>
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
        <span className="text-xs text-gray-500">Sponsored</span>
      </div>
    </div>
  );

  const renderNativeAd = () => (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {ad.imageUrl ? (
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="h-12 w-12 rounded object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200">
                <Building className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="line-clamp-1 text-sm font-medium text-gray-900">
                {ad.title}
              </h3>
              <Badge variant="secondary" className="text-xs">
                Sponsored
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">{ad.businessName}</p>
            {ad.description && (
              <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                {ad.description}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500">
                <MapPin className="mr-1 h-3 w-3" />
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
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
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
          {ad.imageUrl ? (
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="h-16 w-16 rounded object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-200">
              <Building className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="cursor-pointer text-lg font-semibold text-blue-600 hover:text-blue-800">
            {ad.title}
          </h3>
          <p className="mb-1 text-sm text-green-600">{ad.targetUrl}</p>
          <p className="mb-2 text-sm text-gray-700">{ad.businessName}</p>
          {ad.description && (
            <p className="line-clamp-2 text-sm text-gray-600">
              {ad.description}
            </p>
          )}
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <MapPin className="mr-1 h-4 w-4" />
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
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Advertisement Preview</DialogTitle>
              <DialogDescription>
                Preview how your advertisement will appear across different
                devices and placements
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Ad Information */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge className={adStatus.color}>{adStatus.label}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Campaign Period</p>
              <p className="text-sm font-medium">
                {formatDate(ad.startDate)} - {formatDate(ad.endDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Target Areas</p>
              <p className="text-sm font-medium">{ad.zipCodes}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Budget</p>
              <p className="text-sm font-medium">
                {ad.budget ? formatCurrency(ad.budget) : 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Device and Placement Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Device Preview
            </label>
            <div className="flex space-x-2">
              <Button
                variant={selectedDevice === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDevice('desktop')}
              >
                <Monitor className="mr-2 h-4 w-4" />
                Desktop
              </Button>
              <Button
                variant={selectedDevice === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDevice('tablet')}
              >
                <Tablet className="mr-2 h-4 w-4" />
                Tablet
              </Button>
              <Button
                variant={selectedDevice === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDevice('mobile')}
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Mobile
              </Button>
            </div>
          </div>

          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">
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
                variant={
                  selectedPlacement === 'sidebar' ? 'default' : 'outline'
                }
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
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
          <div className={`transition-all duration-300 ${getDeviceClass()}`}>
            <div className="rounded-lg bg-gray-100 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {selectedPlacement.charAt(0).toUpperCase() +
                    selectedPlacement.slice(1)}{' '}
                  Ad Preview
                </h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Eye className="mr-1 h-4 w-4" />
                  {selectedDevice.charAt(0).toUpperCase() +
                    selectedDevice.slice(1)}{' '}
                  View
                </div>
              </div>

              {/* Mock website context */}
              <div className="mb-4 rounded border border-gray-200 bg-white p-4">
                <div className="mb-2 h-4 rounded bg-gray-200"></div>
                <div className="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>

                {selectedPlacement === 'banner' && (
                  <div className="mb-4">{renderAdPreview()}</div>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                  <div className="lg:col-span-3">
                    <div className="space-y-3">
                      <div className="h-3 rounded bg-gray-200"></div>
                      <div className="h-3 w-5/6 rounded bg-gray-200"></div>
                      <div className="h-3 w-4/6 rounded bg-gray-200"></div>

                      {selectedPlacement === 'native' && (
                        <div className="my-4">{renderAdPreview()}</div>
                      )}

                      {selectedPlacement === 'search' && (
                        <div className="my-4">{renderAdPreview()}</div>
                      )}

                      <div className="h-3 rounded bg-gray-200"></div>
                      <div className="h-3 w-3/4 rounded bg-gray-200"></div>
                    </div>
                  </div>

                  {selectedPlacement === 'sidebar' && (
                    <div className="lg:col-span-1">{renderAdPreview()}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
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
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Target URL
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { AdPreviewModal };
export default AdPreviewModal;
