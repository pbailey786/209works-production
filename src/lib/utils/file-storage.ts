/**
 * File Storage Utilities
 * Handles file uploads to Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface FileUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  metadata?: {
    size: number;
    type: string;
    uploadTime: number;
  };
}

export interface FileDeleteResult {
  success: boolean;
  error?: string;
}

export class FileStorageService {
  private static readonly RESUME_BUCKET = 'resumes';
  private static readonly PROFILE_IMAGES_BUCKET = 'profile-images';
  private static readonly COMPANY_LOGOS_BUCKET = 'company-logos';

  /**
   * Save resume file to Supabase Storage
   */
  static async saveResumeFile(
    file: File,
    userId: string,
    filename?: string
  ): Promise<FileUploadResult> {
    const startTime = Date.now();
    
    try {
      // Generate unique filename if not provided
      const finalFilename = filename || this.generateUniqueFilename(file.name, userId);
      const filePath = `${userId}/${finalFilename}`;

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.RESUME_BUCKET)
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: true
        });

      if (error) {
        return {
          success: false,
          error: `Upload failed: ${error.message}`
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.RESUME_BUCKET)
        .getPublicUrl(filePath);

      const uploadTime = Date.now() - startTime;

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath,
        metadata: {
          size: file.size,
          type: file.type,
          uploadTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Save profile image
   */
  static async saveProfileImage(
    file: File,
    userId: string,
    filename?: string
  ): Promise<FileUploadResult> {
    const startTime = Date.now();
    
    try {
      // Validate image file
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: 'File must be an image'
        };
      }

      // Check file size (max 2MB for profile images)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'Image file too large (max 2MB)'
        };
      }

      const finalFilename = filename || this.generateUniqueFilename(file.name, userId);
      const filePath = `${userId}/${finalFilename}`;

      const arrayBuffer = await file.arrayBuffer();

      const { data, error } = await supabase.storage
        .from(this.PROFILE_IMAGES_BUCKET)
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: true
        });

      if (error) {
        return {
          success: false,
          error: `Upload failed: ${error.message}`
        };
      }

      const { data: urlData } = supabase.storage
        .from(this.PROFILE_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      const uploadTime = Date.now() - startTime;

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath,
        metadata: {
          size: file.size,
          type: file.type,
          uploadTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Save company logo
   */
  static async saveCompanyLogo(
    file: File,
    companyId: string,
    filename?: string
  ): Promise<FileUploadResult> {
    const startTime = Date.now();
    
    try {
      // Validate image file
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: 'File must be an image'
        };
      }

      // Check file size (max 1MB for logos)
      const maxSize = 1 * 1024 * 1024;
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'Logo file too large (max 1MB)'
        };
      }

      const finalFilename = filename || this.generateUniqueFilename(file.name, companyId);
      const filePath = `${companyId}/${finalFilename}`;

      const arrayBuffer = await file.arrayBuffer();

      const { data, error } = await supabase.storage
        .from(this.COMPANY_LOGOS_BUCKET)
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: true
        });

      if (error) {
        return {
          success: false,
          error: `Upload failed: ${error.message}`
        };
      }

      const { data: urlData } = supabase.storage
        .from(this.COMPANY_LOGOS_BUCKET)
        .getPublicUrl(filePath);

      const uploadTime = Date.now() - startTime;

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath,
        metadata: {
          size: file.size,
          type: file.type,
          uploadTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(bucket: string, filePath: string): Promise<FileDeleteResult> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        return {
          success: false,
          error: `Delete failed: ${error.message}`
        };
      }

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delete error'
      };
    }
  }

  /**
   * Delete resume file
   */
  static async deleteResumeFile(filePath: string): Promise<FileDeleteResult> {
    return this.deleteFile(this.RESUME_BUCKET, filePath);
  }

  /**
   * Delete profile image
   */
  static async deleteProfileImage(filePath: string): Promise<FileDeleteResult> {
    return this.deleteFile(this.PROFILE_IMAGES_BUCKET, filePath);
  }

  /**
   * Delete company logo
   */
  static async deleteCompanyLogo(filePath: string): Promise<FileDeleteResult> {
    return this.deleteFile(this.COMPANY_LOGOS_BUCKET, filePath);
  }

  /**
   * Get file info from storage
   */
  static async getFileInfo(bucket: string, filePath: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(filePath.substring(0, filePath.lastIndexOf('/')), {
          search: filePath.substring(filePath.lastIndexOf('/') + 1)
        });

      if (error) {
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }

  /**
   * Generate unique filename
   */
  private static generateUniqueFilename(originalName: string, prefix: string): string {
    const extension = originalName.substring(originalName.lastIndexOf('.'));
    const baseName = originalName.replace(extension, '');
    const sanitizedBase = this.sanitizeFilename(baseName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    return `${sanitizedBase}_${timestamp}_${random}${extension}`;
  }

  /**
   * Sanitize filename for safe storage
   */
  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 100); // Limit length
  }

  /**
   * Get signed URL for private files
   */
  static async getSignedUrl(bucket: string, filePath: string, expiresIn: number = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
  }

  /**
   * List files in a directory
   */
  static async listFiles(bucket: string, directory: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(directory);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }
}

// Export convenience functions
export const saveResumeFile = FileStorageService.saveResumeFile.bind(FileStorageService);
export const saveProfileImage = FileStorageService.saveProfileImage.bind(FileStorageService);
export const saveCompanyLogo = FileStorageService.saveCompanyLogo.bind(FileStorageService);
