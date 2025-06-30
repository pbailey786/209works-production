'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Building } from 'lucide-react';
import Image from 'next/image';

// Add server-side compatibility
const isClient = typeof window !== 'undefined';

interface LogoUploadProps {
  currentLogo?: string | null;
  onLogoChange: (logoUrl: string | null) => void;
  companyName?: string;
}

export default function LogoUpload({ currentLogo, onLogoChange, companyName = 'Company' }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Convert to base64 for preview and storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setPreview(base64);
        
        // In a production app, you'd upload to a CDN here
        // For now, we'll store the base64 string
        // This is similar to how profile pictures are handled
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        onLogoChange(base64);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to upload logo');
      setIsUploading(false);
    }
  };

  const removeLogo = () => {
    setPreview(null);
    onLogoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Company Logo
      </label>
      
      <div className="flex items-center gap-6">
        {/* Logo Preview */}
        <div className="relative">
          {preview ? (
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200">
              <Image
                src={preview}
                alt="Company logo"
                fill
                className="object-contain p-2 bg-white"
              />
              {!isUploading && (
                <button
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-gray-200">
              <div className="text-center">
                <Building className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">{getInitials(companyName)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="logo-upload"
          />
          <label
            htmlFor="logo-upload"
            className={`
              inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer
              transition-colors text-sm font-medium
              ${isUploading 
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {preview ? 'Change Logo' : 'Upload Logo'}
              </>
            )}
          </label>
          
          <div className="mt-2 text-xs text-gray-500">
            PNG, JPG up to 5MB. Square images work best.
          </div>
          
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}