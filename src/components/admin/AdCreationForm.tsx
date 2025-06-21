'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

interface AdFormData {
  title: string;
  businessName: string;
  description: string;
  targetUrl: string;
  imageUrl: string;
  zipCodes: string;
  startDate: Date | null;
  endDate: Date | null;
  type: string;
  budget: string;
}

interface AdFormErrors {
  title?: string;
  businessName?: string;
  description?: string;
  targetUrl?: string;
  imageUrl?: string;
  zipCodes?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  budget?: string;
}

export default function AdCreationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const [formData, setFormData] = useState<AdFormData>({
    title: '',
    businessName: '',
    description: '',
    targetUrl: '',
    imageUrl: '',
    zipCodes: '',
    startDate: null,
    endDate: null,
    type: '',
    budget: ''
  });

  const [errors, setErrors] = useState<AdFormErrors>({});

  const handleInputChange = (
    field: keyof AdFormData,
    value: string | Date | null
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: AdFormErrors = {};

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

    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate >= formData.endDate
    ) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.type) {
      newErrors.type = 'Ad type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
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

    setIsLoading(true);

    try {
      // In a real implementation, you'd call an API endpoint to create the ad
      console.log('Creating ad with data:', formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('Advertisement created successfully!');
      router.push('/admin/ads');
    } catch (error) {
      console.error('Error creating ad:', error);
      alert('An error occurred while creating the advertisement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
            <p className="text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={e => handleInputChange('businessName', e.target.value)}
            placeholder="Enter business name"
            className={errors.businessName ? 'border-red-500' : ''}
          />
          {errors.businessName && (
            <p className="text-sm text-red-500">{errors.businessName}</p>
          )}
        </div>

        {/* Target URL */}
        <div className="space-y-2">
          <Label htmlFor="targetUrl">Target URL *</Label>
          <Input
            id="targetUrl"
            type="url"
            value={formData.targetUrl}
            onChange={e => handleInputChange('targetUrl', e.target.value)}
            placeholder="https://example.com"
            className={errors.targetUrl ? 'border-red-500' : ''}
          />
          {errors.targetUrl && (
            <p className="text-sm text-red-500">{errors.targetUrl}</p>
          )}
        </div>

        {/* Image URL */}
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            type="url"
            value={formData.imageUrl}
            onChange={e => handleInputChange('imageUrl', e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          <p className="text-xs text-gray-500">
            Optional: URL to the advertisement image
          </p>
        </div>

        {/* Ad Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Advertisement Type *</Label>
          <Select
            value={formData.type}
            onValueChange={value => handleInputChange('type', value)}
          >
            <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select ad type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="banner">Banner Ad</SelectItem>
              <SelectItem value="sidebar">Sidebar Ad</SelectItem>
              <SelectItem value="featured_job">Featured Job</SelectItem>
              <SelectItem value="sponsored_search">Sponsored Search</SelectItem>
              <SelectItem value="native">Native Ad</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <Label htmlFor="budget">Budget (USD)</Label>
          <Input
            id="budget"
            type="number"
            min="0"
            step="0.01"
            value={formData.budget}
            onChange={e => handleInputChange('budget', e.target.value)}
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500">
            Optional: Total campaign budget
          </p>
        </div>
      </div>

      {/* Target Zip Codes */}
      <div className="space-y-2">
        <Label htmlFor="zipCodes">Target Zip Codes *</Label>
        <Input
          id="zipCodes"
          value={formData.zipCodes}
          onChange={e => handleInputChange('zipCodes', e.target.value)}
          placeholder="12345, 67890, 54321"
          className={errors.zipCodes ? 'border-red-500' : ''}
        />
        <p className="text-xs text-gray-500">
          Comma-separated list of zip codes to target
        </p>
        {errors.zipCodes && (
          <p className="text-sm text-red-500">{errors.zipCodes}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => handleInputChange('description', e.target.value)}
          placeholder="Enter advertisement description..."
          rows={4}
        />
        <p className="text-xs text-gray-500">
          Optional: Additional details about the advertisement
        </p>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Start Date */}
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${errors.startDate ? 'border-red-500' : ''}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate
                  ? format(formData.startDate, 'PPP')
                  : 'Select start date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.startDate || undefined}
                onSelect={date => {
                  handleInputChange('startDate', date || null);
                  setStartDateOpen(false);
                }}
                disabled={date => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.startDate && (
            <p className="text-sm text-red-500">{errors.startDate}</p>
          )}
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label>End Date *</Label>
          <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${errors.endDate ? 'border-red-500' : ''}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.endDate
                  ? format(formData.endDate, 'PPP')
                  : 'Select end date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.endDate || undefined}
                onSelect={date => {
                  handleInputChange('endDate', date || null);
                  setEndDateOpen(false);
                }}
                disabled={date =>
                  date < new Date() ||
                  (formData.startDate ? date <= formData.startDate : false)
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.endDate && (
            <p className="text-sm text-red-500">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex space-x-4 pt-6">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Advertisement'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/ads')}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
