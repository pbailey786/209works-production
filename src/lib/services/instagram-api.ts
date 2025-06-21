import axios, { AxiosInstance } from 'axios';
import path from "path";

export interface InstagramCredentials {
  accessToken: string;
  instagramBusinessAccountId: string;
  facebookPageId?: string;
}

export interface InstagramMediaResponse {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  media_product_type: string;
}

export interface InstagramInsightsResponse {
  data: Array<{
    name: string;
    period: string;
    values: Array<{
      value: number;
      end_time: string;
    }>;
    title: string;
    description: string;
    id: string;
  }>;
}

export interface PublishPostOptions {
  imageUrl?: string;
  imageData?: Buffer;
  caption: string;
  accessToken: string;
  instagramBusinessAccountId: string;
}

export class InstagramAPI {
  private client: AxiosInstance;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      config => {
        console.log(
          `Instagram API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      error => {
        console.error('Instagram API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => {
        return response;
      },
      error => {
        console.error(
          'Instagram API Response Error:',
          error.response?.data || error.message
        );
        return Promise.reject(this.handleAPIError(error));
      }
    );
  }

  /**
   * Validate Instagram credentials
   */
  async validateCredentials(
    credentials: InstagramCredentials
  ): Promise<boolean> {
    try {
      const response = await this.client.get(
        `/${credentials.instagramBusinessAccountId}`,
        {
          params: {
            fields: 'id,username,account_type',
            access_token: credentials.accessToken,
          },
        }
      );

      return (
        response.data &&
        response.data.id === credentials.instagramBusinessAccountId
      );
    } catch (error) {
      console.error('Failed to validate Instagram credentials:', error);
      return false;
    }
  }

  /**
   * Upload image and create media object
   */
  async createMediaObject(options: PublishPostOptions): Promise<string> {
    try {
      let imageUrl = options.imageUrl;

      // If imageData is provided, we need to upload it first
      // This would typically involve uploading to a CDN or temporary storage
      if (options.imageData && !imageUrl) {
        // TODO: Implement image upload to CDN (AWS S3, Cloudinary, etc.)
        throw new Error(
          'Image upload to CDN not implemented yet. Please provide imageUrl.'
        );
      }

      if (!imageUrl) {
        throw new Error('Either imageUrl or imageData must be provided');
      }

      const response = await this.client.post(
        `/${options.instagramBusinessAccountId}/media`,
        {
          image_url: imageUrl,
          caption: options.caption,
          access_token: options.accessToken,
        }
      );

      return response.data.id;
    } catch (error) {
      console.error('Failed to create Instagram media object:', error);
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create media object: ${message}`);
    }
  }

  /**
   * Publish a media object
   */
  async publishMedia(
    mediaObjectId: string,
    credentials: InstagramCredentials
  ): Promise<string> {
    try {
      const response = await this.client.post(
        `/${credentials.instagramBusinessAccountId}/media_publish`,
        {
          creation_id: mediaObjectId,
          access_token: credentials.accessToken,
        }
      );

      return response.data.id;
    } catch (error) {
      console.error('Failed to publish Instagram media:', error);
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to publish media: ${message}`);
    }
  }

  /**
   * Publish a post (combines create and publish)
   */
  async publishPost(options: PublishPostOptions): Promise<{
    mediaId: string;
    publishedId: string;
    permalink?: string;
  }> {
    try {
      // Step 1: Create media object
      const mediaObjectId = await this.createMediaObject(options);

      // Step 2: Publish the media
      const publishedId = await this.publishMedia(mediaObjectId, {
        accessToken: options.accessToken,
        instagramBusinessAccountId: options.instagramBusinessAccountId,
      });

      // Step 3: Get permalink
      const permalink = await this.getMediaPermalink(
        publishedId,
        options.accessToken
      );

      return {
        mediaId: mediaObjectId,
        publishedId,
        permalink,
      };
    } catch (error) {
      console.error('Failed to publish Instagram post:', error);
      throw error;
    }
  }

  /**
   * Get media permalink
   */
  async getMediaPermalink(
    mediaId: string,
    accessToken: string
  ): Promise<string> {
    try {
      const response = await this.client.get(`/${mediaId}`, {
        params: {
          fields: 'permalink',
          access_token: accessToken,
        },
      });

      return response.data.permalink;
    } catch (error) {
      console.error('Failed to get media permalink:', error);
      return '';
    }
  }

  /**
   * Get media insights (analytics)
   */
  async getMediaInsights(
    mediaId: string,
    accessToken: string,
    metrics: string[] = ['impressions', 'reach', 'likes', 'comments', 'shares']
  ): Promise<InstagramInsightsResponse> {
    try {
      const response = await this.client.get(`/${mediaId}/insights`, {
        params: {
          metric: metrics.path.join(','),
          access_token: accessToken,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get media insights:', error);
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get insights: ${message}`);
    }
  }

  /**
   * Get account insights
   */
  async getAccountInsights(
    instagramBusinessAccountId: string,
    accessToken: string,
    period: 'day' | 'week' | 'days_28' = 'day',
    metrics: string[] = ['impressions', 'reach', 'profile_views']
  ): Promise<InstagramInsightsResponse> {
    try {
      const response = await this.client.get(
        `/${instagramBusinessAccountId}/insights`,
        {
          params: {
            metric: metrics.path.join(','),
            period,
            access_token: accessToken,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get account insights:', error);
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get account insights: ${message}`);
    }
  }

  /**
   * Get recent media
   */
  async getRecentMedia(
    instagramBusinessAccountId: string,
    accessToken: string,
    limit: number = 25
  ): Promise<InstagramMediaResponse[]> {
    try {
      const response = await this.client.get(
        `/${instagramBusinessAccountId}/media`,
        {
          params: {
            fields:
              'id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count',
            limit,
            access_token: accessToken,
          },
        }
      );

      return response.data.data || [];
    } catch (error) {
      console.error('Failed to get recent media:', error);
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get recent media: ${message}`);
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo(
    instagramBusinessAccountId: string,
    accessToken: string
  ): Promise<{
    id: string;
    username: string;
    name: string;
    biography?: string;
    website?: string;
    followers_count?: number;
    follows_count?: number;
    media_count?: number;
  }> {
    try {
      const response = await this.client.get(`/${instagramBusinessAccountId}`, {
        params: {
          fields:
            'id,username,name,biography,website,followers_count,follows_count,media_count',
          access_token: accessToken,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get account info:', error);
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get account info: ${message}`);
    }
  }

  /**
   * Handle API errors
   */
  private handleAPIError(error: any): Error {
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      return new Error(
        `Instagram API Error: ${apiError.message} (Code: ${apiError.code})`
      );
    }

    if (error.code === 'ECONNABORTED') {
      return new Error('Instagram API request timed out');
    }

    return new Error(`Instagram API Error: ${error.message}`);
  }

  /**
   * Test connection to Instagram API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Simple test to check if the API is reachable
      const response = await this.client.get('/me', {
        params: {
          access_token: 'test_token', // This will fail but tells us if API is reachable
        },
        timeout: 5000,
      });
      return true;
    } catch (error: any) {
      // If we get a specific API error (not network error), the API is reachable
      return error.response?.status === 400 || error.response?.status === 401;
    }
  }
}

/**
 * Utility functions for Instagram API
 */
export class InstagramUtils {
  /**
   * Validate Instagram caption length and format
   */
  static validateCaption(caption: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (caption.length > 2200) {
      errors.push('Caption exceeds 2200 character limit');
    }

    if (caption.length === 0) {
      errors.push('Caption cannot be empty');
    }

    // Check for excessive hashtags
    const hashtagCount = (caption.match(/#\w+/g) || []).length;
    if (hashtagCount > 30) {
      errors.push('Caption contains more than 30 hashtags');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract hashtags from caption
   */
  static extractHashtags(caption: string): string[] {
    const hashtags = caption.match(/#\w+/g) || [];
    return hashtags.map(tag => tag.toLowerCase());
  }

  /**
   * Format hashtags for Instagram
   */
  static formatHashtags(hashtags: string[]): string {
    return hashtags
      .map(tag => (tag.startsWith('#') ? tag : `#${tag}`))
      .path.join(' ');
  }

  /**
   * Generate optimal posting times based on audience insights
   */
  static getOptimalPostingTimes(): { day: string; times: string[] }[] {
    return [
      { day: 'Monday', times: ['11:00', '14:00', '17:00'] },
      { day: 'Tuesday', times: ['11:00', '13:00', '17:00'] },
      { day: 'Wednesday', times: ['11:00', '13:00', '17:00'] },
      { day: 'Thursday', times: ['11:00', '13:00', '17:00'] },
      { day: 'Friday', times: ['10:00', '13:00', '15:00'] },
      { day: 'Saturday', times: ['10:00', '12:00', '14:00'] },
      { day: 'Sunday', times: ['12:00', '14:00', '16:00'] },
    ];
  }
}

export default InstagramAPI;
