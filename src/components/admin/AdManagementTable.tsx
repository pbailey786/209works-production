import { useState } from '@/components/ui/card';
import { Badge } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

'use client';

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
  Building,
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
  limit,
}: AdManagementTableProps) {
  const [selectedAds, setSelectedAds] = useState<string[]>([]);
  const [actionsOpen, setActionsOpen] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);

  const handleSelectAd = (adId: string) => {
    setSelectedAds(prev =>
      prev.includes(adId) ? prev.filter(id => id !== adId) : [...prev, adId]
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
      return {
        status: 'scheduled',
        label: 'Scheduled',
        color: 'bg-blue-100 text-blue-800',
      };
    } else if (endDate < now) {
      return {
        status: 'expired',
        label: 'Expired',
        color: 'bg-gray-100 text-gray-800',
      };
    } else {
      return {
        status: 'active',
        label: 'Active',
        color: 'bg-green-100 text-green-800',
      };
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
        body:
          action !== 'delete'
            ? JSON.stringify({
                action: action === 'activate' ? 'activate' : 'pause',
              })
            : undefined,
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

    if (
      !confirm(
        `Are you sure you want to ${action} ${selectedAds.length} advertisement(s)?`
      )
    ) {
      return;
    }

    try {
      const promises = selectedAds.map(adId =>
        fetch(`/api/ads/${adId}`, {
          method: action === 'delete' ? 'DELETE' : 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body:
            action !== 'delete'
              ? JSON.stringify({
                  action: action === 'activate' ? 'activate' : 'pause',
                })
              : undefined,
        })
      );

      const results = await Promise.allSettled(promises);
      const failures = results.filter(
        result => result.status === 'rejected'
      ).length;

      if (failures > 0) {
        alert(
          `${failures} out of ${selectedAds.length} operations failed. Please refresh and try again.`
        );
      } else {
        alert(
          `Successfully ${action}d ${selectedAds.length} advertisement(s).`
        );
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
    <div className="rounded-lg bg-white shadow">
      {/* Bulk Actions Bar */}
      {selectedAds.length > 0 && (
        <div className="border-b border-gray-200 bg-blue-50 px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {selectedAds.length} ad{selectedAds.length !== 1 ? 's' : ''}{' '}
              selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
              >
                Activate All
              </button>
              <button
                onClick={() => handleBulkAction('pause')}
                className="rounded-md bg-orange-600 px-3 py-1 text-sm text-white hover:bg-orange-700"
              >
                Pause All
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="border-b border-gray-200 px-6 py-3">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider text-gray-500">
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
        {ads.map(ad => {
          const adStatus = getAdStatus(ad.startDate, ad.endDate);

          return (
            <div key={ad.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="grid grid-cols-12 items-center gap-4">
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
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200">
                          <Building className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-medium text-gray-900">
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
                          className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
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
                    <div className="mb-1 flex items-center text-xs text-gray-500">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDate(ad.startDate)} - {formatDate(ad.endDate)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {getDaysRemaining(ad.endDate)}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <Badge className={adStatus.color}>{adStatus.label}</Badge>
                </div>

                {/* Actions */}
                <div className="relative col-span-1">
                  <button
                    onClick={() =>
                      setActionsOpen(actionsOpen === ad.id ? null : ad.id)
                    }
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {actionsOpen === ad.id && (
                    <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
                      <div className="py-1">
                        <button
                          onClick={() => handleAdAction(ad.id, 'edit')}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="mr-2 h-4 w-4 text-blue-500" />
                          Edit Ad
                        </button>

                        {adStatus.status === 'active' ? (
                          <button
                            onClick={() => handleAdAction(ad.id, 'pause')}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Pause className="mr-2 h-4 w-4 text-orange-500" />
                            Pause Ad
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAdAction(ad.id, 'activate')}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Play className="mr-2 h-4 w-4 text-green-500" />
                            Activate Ad
                          </button>
                        )}

                        <button
                          onClick={() => handleAdAction(ad.id, 'analytics')}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <BarChart3 className="mr-2 h-4 w-4 text-purple-500" />
                          View Analytics
                        </button>

                        <button
                          onClick={() => handleAdAction(ad.id, 'preview')}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Eye className="mr-2 h-4 w-4 text-gray-500" />
                          Preview Ad
                        </button>

                        <button
                          onClick={() => handleAdAction(ad.id, 'delete')}
                          className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-red-500" />
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
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * limit + 1} to{' '}
            {Math.min(currentPage * limit, totalCount)} of {totalCount} ads
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href={`/admin/ads?page=${currentPage - 1}`}
              className={`rounded-md p-2 ${
                !hasPrevPage
                  ? 'cursor-not-allowed text-gray-400'
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
              className={`rounded-md p-2 ${
                !hasNextPage
                  ? 'cursor-not-allowed text-gray-400'
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
            <Building className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No advertisements found
            </h3>
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
