'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AdPreviewModal from './AdPreviewModal';
import { 
  MoreVertical,
  Edit,
  Eye,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Calendar,
  DollarSign,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Building
} from 'lucide-react';

interface Advertisement {
  id: string;
  title: string;
  businessName: string;
  imageUrl: string;
  targetUrl: string;
  zipCodes: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

interface AdManagementTableProps {
  ads: Advertisement[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export default function AdManagementTable({
  ads,
  totalCount,
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  limit
}: AdManagementTableProps) {
  const [selectedAds, setSelectedAds] = useState<string[]>([]);
  const [actionsOpen, setActionsOpen] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);

  const handleSelectAd = (adId: string) => {
    setSelectedAds(prev => 
      prev.includes(adId) 
        ? prev.filter(id => id !== adId)
        : [...prev, adId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAds.length === ads.length) {
      setSelectedAds([]);
    } else {
      setSelectedAds(ads.map(ad => ad.id));
    }
  };

  const getAdStatus = (startDate: Date, endDate: Date) => {
    const now = new Date();
    
    if (startDate > now) {
      return { status: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
    } else if (endDate < now) {
      return { status: 'expired', label: 'Expired', color: 'bg-gray-100 text-gray-800' };
    } else {
      return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-800' };
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Ends today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  const handleAdAction = async (adId: string, action: string) => {
    try {
      setActionsOpen(null);
      
      if (action === 'preview') {
        // Handle preview action separately
        const ad = ads.find(a => a.id === adId);
        if (ad) {
          setPreviewAd(ad);
          setShowPreview(true);
        }
        return;
      }

      if (action === 'analytics') {
        // Navigate to analytics page
        window.location.href = `/admin/ads/${adId}/analytics`;
        return;
      }

      if (action === 'edit') {
        // Navigate to edit page
        window.location.href = `/admin/ads/${adId}/edit`;
        return;
      }
      
      // API actions
      const response = await fetch(`/api/ads/${adId}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: action !== 'delete' ? JSON.stringify({ 
          action: action === 'activate' ? 'activate' : 'pause' 
        }) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} advertisement`);
      }

      // Refresh the page to show updated data
      window.location.reload();
      
    } catch (error) {
      console.error('Error performing ad action:', error);
      alert(`An error occurred while trying to ${action} the advertisement`);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedAds.length === 0) return;
    
    if (!confirm(`Are you sure you want to ${action} ${selectedAds.length} advertisement(s)?`)) {
      return;
    }
    
    try {
      const promises = selectedAds.map(adId => 
        fetch(`/api/ads/${adId}`, {
          method: action === 'delete' ? 'DELETE' : 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: action !== 'delete' ? JSON.stringify({ 
            action: action === 'activate' ? 'activate' : 'pause' 
          }) : undefined,
        })
      );

      const results = await Promise.allSettled(promises);
      const failures = results.filter(result => result.status === 'rejected').length;
      
      if (failures > 0) {
        alert(`${failures} out of ${selectedAds.length} operations failed. Please refresh and try again.`);
      } else {
        alert(`Successfully ${action}d ${selectedAds.length} advertisement(s).`);
      }
      
      setSelectedAds([]);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('An error occurred while performing the bulk action');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Bulk Actions Bar */}
      {selectedAds.length > 0 && (
        <div className="border-b border-gray-200 px-6 py-3 bg-blue-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {selectedAds.length} ad{selectedAds.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
              >
                Activate All
              </button>
              <button
                onClick={() => handleBulkAction('pause')}
                className="px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700"
              >
                Pause All
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-1">
            <input
              type="checkbox"
              checked={selectedAds.length === ads.length && ads.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-4">Advertisement</div>
          <div className="col-span-2">Business</div>
          <div className="col-span-2">Campaign Period</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {ads.map((ad) => {
          const adStatus = getAdStatus(ad.startDate, ad.endDate);
          
          return (
            <div key={ad.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Checkbox */}
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedAds.includes(ad.id)}
                    onChange={() => handleSelectAd(ad.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {/* Advertisement Details */}
                <div className="col-span-4">
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
                      <div className="text-sm font-medium text-gray-900 line-clamp-2">
                        {ad.title}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Target: {ad.zipCodes}
                      </div>
                      <div className="mt-1">
                        <a 
                          href={ad.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Target
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business */}
                <div className="col-span-2">
                  <div className="text-sm font-medium text-gray-900">
                    {ad.businessName}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created {formatDate(ad.createdAt)}
                  </div>
                </div>

                {/* Campaign Period */}
                <div className="col-span-2">
                  <div className="text-sm text-gray-900">
                    <div className="flex items-center text-xs text-gray-500 mb-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(ad.startDate)} - {formatDate(ad.endDate)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {getDaysRemaining(ad.endDate)}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <Badge className={adStatus.color}>
                    {adStatus.label}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="col-span-1 relative">
                  <button
                    onClick={() => setActionsOpen(actionsOpen === ad.id ? null : ad.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {actionsOpen === ad.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleAdAction(ad.id, 'edit')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 mr-2 text-blue-500" />
                          Edit Ad
                        </button>
                        
                        {adStatus.status === 'active' ? (
                          <button
                            onClick={() => handleAdAction(ad.id, 'pause')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Pause className="h-4 w-4 mr-2 text-orange-500" />
                            Pause Ad
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAdAction(ad.id, 'activate')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Play className="h-4 w-4 mr-2 text-green-500" />
                            Activate Ad
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleAdAction(ad.id, 'analytics')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <BarChart3 className="h-4 w-4 mr-2 text-purple-500" />
                          View Analytics
                        </button>
                        
                        <button
                          onClick={() => handleAdAction(ad.id, 'preview')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Eye className="h-4 w-4 mr-2 text-gray-500" />
                          Preview Ad
                        </button>
                        
                        <button
                          onClick={() => handleAdAction(ad.id, 'delete')}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                          Delete Ad
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} ads
          </div>
          
          <div className="flex items-center space-x-2">
            <Link
              href={`/admin/ads?page=${currentPage - 1}`}
              className={`p-2 rounded-md ${
                !hasPrevPage 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <Link
              href={`/admin/ads?page=${currentPage + 1}`}
              className={`p-2 rounded-md ${
                !hasNextPage 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {ads.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No advertisements found</h3>
            <p>Try adjusting your filters to see more results.</p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewAd && (
        <AdPreviewModal
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setPreviewAd(null);
          }}
          ad={previewAd}
        />
      )}
    </div>
  );
} 