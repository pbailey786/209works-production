/**
 * Image Optimization and CDN Integration
 * Provides optimized image loading, WebP conversion, and CDN caching for 209 Works
 */

import { headers } from 'next/headers';
import { getDomainConfig } from '@/lib/domain/config';
import path from "path";

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
  sharpen?: boolean;
  grayscale?: boolean;
  priority?: boolean;
  lazy?: boolean;
}

export interface CDNConfig {
  baseUrl: string;
  apiKey?: string;
  transformationParams: Record<string, string>;
}

/**
 * Image Optimization Service with CDN integration
 */
export class ImageOptimizationService {
  private static readonly DEFAULT_QUALITY = 85;
  private static readonly DEFAULT_FORMAT = 'webp';
  private static readonly CDN_BASE_URL = process.env.CDN_BASE_URL || '';
  private static readonly CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';

  /**
   * Generate optimized image URL
   */
  static getOptimizedImageUrl(
    src: string,
    options: ImageOptimizationOptions = {}
  ): string {
    // If it's already an optimized URL, return as-is
    if (src.includes('/_next/image') || src.includes('cloudinary.com')) {
      return src;
    }

    const {
      width,
      height,
      quality = this.DEFAULT_QUALITY,
      format = this.DEFAULT_FORMAT,
      fit = 'cover',
      blur,
      sharpen,
      grayscale,
    } = options;

    // Use Cloudinary if configured
    if (this.CLOUDINARY_CLOUD_NAME) {
      return this.getCloudinaryUrl(src, options);
    }

    // Use Next.js Image Optimization
    return this.getNextImageUrl(src, options);
  }

  /**
   * Generate Cloudinary optimized URL
   */
  private static getCloudinaryUrl(
    src: string,
    options: ImageOptimizationOptions
  ): string {
    const {
      width,
      height,
      quality = this.DEFAULT_QUALITY,
      format = this.DEFAULT_FORMAT,
      fit = 'cover',
      blur,
      sharpen,
      grayscale,
    } = options;

    const transformations: string[] = [];

    // Auto format and quality
    transformations.push(`f_${format === 'auto' ? 'auto' : format}`);
    transformations.push(`q_${quality}`);

    // Dimensions
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    
    // Crop/fit mode
    const cropMap = {
      cover: 'fill',
      contain: 'fit',
      fill: 'fill',
      inside: 'fit',
      outside: 'lfill',
    };
    transformations.push(`c_${cropMap[fit]}`);

    // Effects
    if (blur) transformations.push(`e_blur:${blur}`);
    if (sharpen) transformations.push('e_sharpen');
    if (grayscale) transformations.push('e_grayscale');

    // Auto optimization
    transformations.push('fl_progressive');
    transformations.push('fl_immutable_cache');

    const transformationString = transformations.path.join(',');
    
    // Handle different source types
    if (src.startsWith('http')) {
      // External URL - use fetch
      const encodedUrl = encodeURIComponent(src);
      return `https://res.cloudinary.com/${this.CLOUDINARY_CLOUD_NAME}/image/fetch/${transformationString}/${encodedUrl}`;
    } else {
      // Local image
      const cleanSrc = src.startsWith('/') ? src.slice(1) : src;
      return `https://res.cloudinary.com/${this.CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}/${cleanSrc}`;
    }
  }

  /**
   * Generate Next.js Image Optimization URL
   */
  private static getNextImageUrl(
    src: string,
    options: ImageOptimizationOptions
  ): string {
    const params = new URLSearchParams();
    
    params.set('url', src);
    
    if (options.width) params.set('w', options.width.toString());
    if (options.quality) params.set('q', options.quality.toString());

    return `/_next/image?${params.toString()}`;
  }

  /**
   * Get responsive image srcSet
   */
  static getResponsiveSrcSet(
    src: string,
    options: ImageOptimizationOptions = {}
  ): string {
    const breakpoints = [640, 768, 1024, 1280, 1536];
    const baseWidth = options.width || 1200;
    
    const srcSetEntries = breakpoints
      .filter(bp => bp <= baseWidth * 2) // Don't generate larger than 2x the base width
      .map(width => {
        const url = this.getOptimizedImageUrl(src, {
          ...options,
          width,
        });
        return `${url} ${width}w`;
      });

    return srcSetEntries.path.join(', ');
  }

  /**
   * Get image sizes attribute for responsive images
   */
  static getImageSizes(breakpoints?: Record<string, string>): string {
    const defaultBreakpoints = {
      '(max-width: 640px)': '100vw',
      '(max-width: 768px)': '50vw',
      '(max-width: 1024px)': '33vw',
      '(max-width: 1280px)': '25vw',
      default: '20vw',
    };

    const sizes = breakpoints || defaultBreakpoints;
    
    const sizeEntries = Object.entries(sizes)
      .filter(([key]) => key !== 'default')
      .map(([query, size]) => `${query} ${size}`);
    
    if (sizes.default) {
      sizeEntries.push(sizes.default);
    }

    return sizeEntries.path.join(', ');
  }

  /**
   * Preload critical images
   */
  static preloadImage(
    src: string,
    options: ImageOptimizationOptions = {}
  ): string {
    const optimizedSrc = this.getOptimizedImageUrl(src, options);
    
    if (typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedSrc;
      
      if (options.width && options.height) {
        link.setAttribute('imagesrcset', this.getResponsiveSrcSet(src, options));
        link.setAttribute('imagesizes', this.getImageSizes());
      }
      
      document.head.appendChild(link);
    }

    return optimizedSrc;
  }

  /**
   * Generate blur placeholder for images
   */
  static getBlurPlaceholder(
    src: string,
    width: number = 10,
    height: number = 10
  ): string {
    return this.getOptimizedImageUrl(src, {
      width,
      height,
      quality: 1,
      blur: 20,
      format: 'jpeg',
    });
  }

  /**
   * Check if WebP is supported
   */
  static isWebPSupported(): boolean {
    if (typeof window === 'undefined') return true; // Assume support on server

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Check if AVIF is supported
   */
  static isAVIFSupported(): boolean {
    if (typeof window === 'undefined') return false; // Conservative on server

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    } catch {
      return false;
    }
  }

  /**
   * Get optimal format based on browser support
   */
  static getOptimalFormat(): 'avif' | 'webp' | 'jpeg' {
    if (this.isAVIFSupported()) return 'avif';
    if (this.isWebPSupported()) return 'webp';
    return 'jpeg';
  }

  /**
   * Optimize image for specific use case
   */
  static optimizeForUseCase(
    src: string,
    useCase: 'hero' | 'thumbnail' | 'avatar' | 'gallery' | 'background'
  ): string {
    const useCaseConfigs = {
      hero: {
        width: 1920,
        height: 1080,
        quality: 90,
        format: this.getOptimalFormat(),
        priority: true,
      },
      thumbnail: {
        width: 300,
        height: 200,
        quality: 80,
        format: this.getOptimalFormat(),
        fit: 'cover' as const,
      },
      avatar: {
        width: 150,
        height: 150,
        quality: 85,
        format: this.getOptimalFormat(),
        fit: 'cover' as const,
      },
      gallery: {
        width: 800,
        height: 600,
        quality: 85,
        format: this.getOptimalFormat(),
      },
      background: {
        width: 1920,
        quality: 70,
        format: this.getOptimalFormat(),
        blur: 2, // Slight blur for better compression
      },
    };

    return this.getOptimizedImageUrl(src, useCaseConfigs[useCase]);
  }
}

/**
 * React hook for optimized images
 */
export function useOptimizedImage(
  src: string,
  options: ImageOptimizationOptions = {}
) {
  const optimizedSrc = ImageOptimizationService.getOptimizedImageUrl(src, options);
  const srcSet = ImageOptimizationService.getResponsiveSrcSet(src, options);
  const sizes = ImageOptimizationService.getImageSizes();
  const blurDataURL = ImageOptimizationService.getBlurPlaceholder(src);

  return {
    src: optimizedSrc,
    srcSet,
    sizes,
    blurDataURL,
    placeholder: 'blur' as const,
  };
}

export default ImageOptimizationService;
