'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  DollarSign,
  Building,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

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

interface AdEditFormProps {
  ad: Advertisement;
}

export default function AdEditForm({ ad }: AdEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: ad.title,
    businessName: ad.businessName,
    imageUrl: ad.imageUrl,
    targetUrl: ad.targetUrl,
    zipCodes: ad.zipCodes,
    startDate: ad.startDate.toISOString().split('T')[0],
    endDate: ad.endDate.toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.targetUrl.trim()) {
      newErrors.targetUrl = 'Target URL is required';
    } else if (!isValidUrl(formData.targetUrl)) {
      newErrors.targetUrl = 'Please enter a valid URL';
    }

    if (!formData.zipCodes.trim()) {
      newErrors.zipCodes = 'Target zip codes are required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/ads/${ad.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          businessName: formData.businessName.trim(),
          imageUrl: formData.imageUrl.trim() || null,
          targetUrl: formData.targetUrl.trim(),
          zipCodes: formData.zipCodes.trim(),
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update advertisement');
      }

      // Redirect back to ads list with success message
      router.push('/admin/ads?updated=true');
    } catch (error) {
      console.error('Error updating advertisement:', error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'An error occurred while updating the advertisement',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/ads"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Ads
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">ID: {ad.id.slice(0, 8)}...</Badge>
          <Badge variant="outline">Created {formatDate(ad.createdAt)}</Badge>
        </div>
      </div>

      {/* Current Ad Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Current Advertisement</CardTitle>
          <CardDescription>
            Preview of the current advertisement details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {ad.imageUrl ? (
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="h-20 w-20 rounded object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded bg-gray-200">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium">{ad.title}</h3>
              <p className="text-gray-600">{ad.businessName}</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span>{ad.zipCodes}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span>
                    {formatDate(ad.startDate)} - {formatDate(ad.endDate)}
                  </span>
                </div>
                <a
                  href={ad.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="mr-1 h-4 w-4" />
                  {ad.targetUrl}
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Advertisement</CardTitle>
          <CardDescription>
            Update the advertisement details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Advertisement Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
                placeholder="Enter advertisement title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={e =>
                  handleInputChange('businessName', e.target.value)
                }
                placeholder="Enter business name"
                className={errors.businessName ? 'border-red-500' : ''}
              />
              {errors.businessName && (
                <p className="text-sm text-red-600">{errors.businessName}</p>
              )}
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={e => handleInputChange('imageUrl', e.target.value)}
                placeholder="Enter image URL (optional)"
                className={errors.imageUrl ? 'border-red-500' : ''}
              />
              {errors.imageUrl && (
                <p className="text-sm text-red-600">{errors.imageUrl}</p>
              )}
              <p className="text-sm text-gray-500">
                Optional: URL to an image for the advertisement
              </p>
            </div>

            {/* Target URL */}
            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL *</Label>
              <Input
                id="targetUrl"
                value={formData.targetUrl}
                onChange={e => handleInputChange('targetUrl', e.target.value)}
                placeholder="https://example.com"
                className={errors.targetUrl ? 'border-red-500' : ''}
              />
              {errors.targetUrl && (
                <p className="text-sm text-red-600">{errors.targetUrl}</p>
              )}
              <p className="text-sm text-gray-500">
                URL where users will be directed when they click the ad
              </p>
            </div>

            {/* Zip Codes */}
            <div className="space-y-2">
              <Label htmlFor="zipCodes">Target Zip Codes *</Label>
              <Textarea
                id="zipCodes"
                value={formData.zipCodes}
                onChange={e => handleInputChange('zipCodes', e.target.value)}
                placeholder="Enter zip codes (comma-separated)"
                rows={3}
                className={errors.zipCodes ? 'border-red-500' : ''}
              />
              {errors.zipCodes && (
                <p className="text-sm text-red-600">{errors.zipCodes}</p>
              )}
              <p className="text-sm text-gray-500">
                Comma-separated list of zip codes to target
              </p>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={e => handleInputChange('startDate', e.target.value)}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={e => handleInputChange('endDate', e.target.value)}
                  className={errors.endDate ? 'border-red-500' : ''}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              <Link
                href="/admin/ads"
                className="text-gray-600 hover:text-gray-900"
              >
                Cancel
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Advertisement
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
