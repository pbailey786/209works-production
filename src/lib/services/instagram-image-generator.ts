import { Job } from '@prisma/client';
import sharp from 'sharp';
import { getDomainConfig, DomainConfig } from '@/lib/domain/config';

// Optional canvas import - only available if canvas package is installed
let createCanvas: any, loadImage: any, registerFont: any;
try {
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
  loadImage = canvas.loadImage;
  registerFont = canvas.registerFont;
} catch (error) {
  // Canvas not available - image generation will be disabled
  console.warn('Canvas package not available. Instagram image generation disabled.');
}

export interface InstagramImageOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  template?: 'modern' | 'classic' | 'minimal' | 'gradient';
  brandColor?: string;
  domainConfig?: DomainConfig;
}

export interface JobImageData {
  jobTitle: string;
  company: string;
  location: string;
  salary?: string;
  jobType: string;
  postedDate?: string;
}

export class InstagramImageGenerator {
  private defaultOptions: Required<InstagramImageOptions> = {
    width: 1080,
    height: 1080,
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    fontFamily: 'Arial',
    fontSize: 24,
    template: 'modern',
    brandColor: '#3b82f6',
    domainConfig: getDomainConfig('209.works')
  };

  constructor(private options: InstagramImageOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Generate an Instagram image for a job listing
   */
  async generateJobImage(jobData: JobImageData, customOptions?: InstagramImageOptions): Promise<Buffer> {
    // Check if canvas is available
    if (!createCanvas) {
      throw new Error('Canvas package not available. Instagram image generation is disabled. Install the canvas package to enable this feature.');
    }

    const opts: Required<InstagramImageOptions> = {
      ...this.defaultOptions,
      ...this.options,
      ...customOptions
    };

    // Get domain config if not provided
    if (!opts.domainConfig) {
      opts.domainConfig = getDomainConfig('209.works'); // Default fallback
    }

    // Apply domain-specific branding
    if (opts.domainConfig) {
      opts.brandColor = opts.domainConfig.branding.primaryColor;
    }

    try {
      const canvas = createCanvas(opts.width, opts.height);
      const ctx = canvas.getContext('2d');

      // Apply template-specific styling
      await this.applyTemplate(ctx as any, opts, jobData);

      // Convert canvas to buffer
      const buffer = canvas.toBuffer('image/png');
      
      // Optimize with sharp
      return await sharp(buffer)
        .png({ quality: 90 })
        .toBuffer();
    } catch (error) {
      console.error('Error generating Instagram image:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate Instagram image: ${message}`);
    }
  }

  /**
   * Generate image from Job model
   */
  async generateFromJob(job: Job, customOptions?: InstagramImageOptions): Promise<Buffer> {
    const jobData: JobImageData = {
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      salary: job.salaryMin && job.salaryMax 
        ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
        : undefined,
      jobType: job.jobType.replace('_', ' ').toUpperCase(),
      postedDate: job.createdAt.toLocaleDateString()
    };

    return this.generateJobImage(jobData, customOptions);
  }

  /**
   * Apply template-specific styling to the canvas
   */
  private async applyTemplate(
    ctx: any, 
    opts: Required<InstagramImageOptions>, 
    jobData: JobImageData
  ): Promise<void> {
    const { width, height } = opts;

    switch (opts.template) {
      case 'modern':
        await this.applyModernTemplate(ctx, opts, jobData);
        break;
      case 'classic':
        await this.applyClassicTemplate(ctx, opts, jobData);
        break;
      case 'minimal':
        await this.applyMinimalTemplate(ctx, opts, jobData);
        break;
      case 'gradient':
        await this.applyGradientTemplate(ctx, opts, jobData);
        break;
      default:
        await this.applyModernTemplate(ctx, opts, jobData);
    }
  }

  /**
   * Modern template with geometric shapes and clean typography
   */
  private async applyModernTemplate(
    ctx: any, 
    opts: Required<InstagramImageOptions>, 
    jobData: JobImageData
  ): Promise<void> {
    const { width, height, backgroundColor, textColor, brandColor } = opts;

    // Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Brand accent bar
    ctx.fillStyle = brandColor;
    ctx.fillRect(0, 0, width, 8);

    // Geometric accent
    ctx.fillStyle = brandColor;
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.arc(width - 100, 100, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Content area
    const contentY = 150;
    const padding = 60;

    // Job title
    ctx.fillStyle = textColor;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'left';
    this.wrapText(ctx, jobData.jobTitle, padding, contentY, width - (padding * 2), 60);

    // Company
    ctx.fillStyle = brandColor;
    ctx.font = 'bold 32px Arial';
    ctx.fillText(jobData.company, padding, contentY + 120);

    // Location and job type
    ctx.fillStyle = textColor;
    ctx.font = '28px Arial';
    ctx.fillText(`📍 ${jobData.location}`, padding, contentY + 180);
    ctx.fillText(`💼 ${jobData.jobType}`, padding, contentY + 220);

    // Salary if available
    if (jobData.salary) {
      ctx.fillStyle = '#10b981'; // Green for salary
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`💰 ${jobData.salary}`, padding, contentY + 280);
    }

    // Call to action
    const ctaY = height - 200;
    ctx.fillStyle = brandColor;
    ctx.fillRect(padding, ctaY, width - (padding * 2), 80);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    const domain = opts.domainConfig?.domain || '209.works';
    ctx.fillText(`Apply Now on ${domain}`, width / 2, ctaY + 50);

    // Footer
    ctx.fillStyle = textColor;
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('#209jobs #hiring #jobs #career', width / 2, height - 60);
  }

  /**
   * Classic template with traditional layout
   */
  private async applyClassicTemplate(
    ctx: any, 
    opts: Required<InstagramImageOptions>, 
    jobData: JobImageData
  ): Promise<void> {
    const { width, height, backgroundColor, textColor } = opts;

    // Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Header
    ctx.fillStyle = textColor;
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('JOB OPPORTUNITY', width / 2, 100);

    // Content
    const contentY = 200;
    ctx.textAlign = 'left';
    
    ctx.font = 'bold 42px Arial';
    this.wrapText(ctx, jobData.jobTitle, 60, contentY, width - 120, 50);

    ctx.font = '32px Arial';
    ctx.fillText(`Company: ${jobData.company}`, 60, contentY + 120);
    ctx.fillText(`Location: ${jobData.location}`, 60, contentY + 170);
    ctx.fillText(`Type: ${jobData.jobType}`, 60, contentY + 220);

    if (jobData.salary) {
      ctx.fillText(`Salary: ${jobData.salary}`, 60, contentY + 270);
    }

    // Footer
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px Arial';
    const domain = opts.domainConfig?.domain || '209.works';
    ctx.fillText(`Visit ${domain} to apply`, width / 2, height - 100);
  }

  /**
   * Minimal template with lots of white space
   */
  private async applyMinimalTemplate(
    ctx: any, 
    opts: Required<InstagramImageOptions>, 
    jobData: JobImageData
  ): Promise<void> {
    const { width, height } = opts;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Dark text
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';

    // Job title
    ctx.font = 'bold 44px Arial';
    this.wrapText(ctx, jobData.jobTitle, width / 2, 300, width - 120, 60, 'center');

    // Company
    ctx.font = '32px Arial';
    ctx.fillText(jobData.company, width / 2, 400);

    // Location
    ctx.font = '28px Arial';
    ctx.fillText(jobData.location, width / 2, 450);

    // Simple line
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 100, 500);
    ctx.lineTo(width / 2 + 100, 500);
    ctx.stroke();

    // CTA
    ctx.font = '24px Arial';
    const domain = opts.domainConfig?.domain || '209.works';
    ctx.fillText(domain, width / 2, 600);
  }

  /**
   * Gradient template with colorful background
   */
  private async applyGradientTemplate(
    ctx: any, 
    opts: Required<InstagramImageOptions>, 
    jobData: JobImageData
  ): Promise<void> {
    const { width, height, brandColor } = opts;

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, brandColor);
    gradient.addColorStop(1, '#8b5cf6');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // White text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    // Job title
    ctx.font = 'bold 48px Arial';
    this.wrapText(ctx, jobData.jobTitle, width / 2, 250, width - 120, 60, 'center');

    // Company
    ctx.font = 'bold 36px Arial';
    ctx.fillText(jobData.company, width / 2, 350);

    // Details
    ctx.font = '28px Arial';
    ctx.fillText(`${jobData.location} • ${jobData.jobType}`, width / 2, 400);

    if (jobData.salary) {
      ctx.font = 'bold 32px Arial';
      ctx.fillText(jobData.salary, width / 2, 450);
    }

    // CTA button
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(width / 2 - 150, 550, 300, 60);
    
    ctx.fillStyle = brandColor;
    ctx.font = 'bold 24px Arial';
    const domain = opts.domainConfig?.domain || '209.works';
    ctx.fillText(`Apply on ${domain}`, width / 2, 590);
  }

  /**
   * Utility function to wrap text
   */
  private wrapText(
    ctx: any, 
    text: string, 
    x: number, 
    y: number, 
    maxWidth: number, 
    lineHeight: number,
    align: 'left' | 'center' = 'left'
  ): void {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        const textX = align === 'center' ? x : x;
        ctx.fillText(line, textX, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    
    const textX = align === 'center' ? x : x;
    ctx.fillText(line, textX, currentY);
  }

  /**
   * Generate a batch of images for multiple jobs
   */
  async generateBatch(jobs: Job[], customOptions?: InstagramImageOptions): Promise<Buffer[]> {
    const images: Buffer[] = [];
    
    for (const job of jobs) {
      try {
        const image = await this.generateFromJob(job, customOptions);
        images.push(image);
      } catch (error) {
        console.error(`Failed to generate image for job ${job.id}:`, error);
        // Continue with other jobs
      }
    }
    
    return images;
  }

  /**
   * Get available templates
   */
  static getAvailableTemplates(): string[] {
    return ['modern', 'classic', 'minimal', 'gradient'];
  }
}

export default InstagramImageGenerator; 