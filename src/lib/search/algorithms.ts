import { SearchFilters } from '../cache/pagination';


export const SEARCH_CONFIG = {
  // Weight factors for relevance scoring
  weights: {
    titleMatch: 10,
    exactTitleMatch: 20,
    descriptionMatch: 5,
    companyMatch: 8,
    locationMatch: 6,
    skillsMatch: 12,
    recency: 3,
  },

  // Full-text search configuration
  fullText: {
    minQueryLength: 2,
    maxQueryLength: 100,
    stopWords: [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ] as const,
  },

  // Geolocation search configuration
  geolocation: {
    defaultRadius: 25, // miles
    maxRadius: 100,
    minRadius: 1,
  },

  // Security and performance limits
  limits: {
    maxTextLength: 10000, // Prevent DoS attacks
    maxQueryTerms: 50,
    maxFacetItems: 1000,
    regexTimeout: 100, // milliseconds
  },
} as const;

// Search result interface with relevance score
export interface SearchResult<T> {
  item: T;
  relevanceScore: number;
  matchedFields: string[];
  snippet?: string;
}

// Enhanced search filters with geolocation
export interface EnhancedSearchFilters extends SearchFilters {
  // Geolocation search
  lat?: number;
  lng?: number;
  radius?: number; // miles

  // Advanced filters
  skills?: string[];
  experience?: string;
  education?: string;
  workAuthorization?: string;

  // Search behavior
  includeSnippets?: boolean;
  highlightMatches?: boolean;
  useRelevanceScoring?: boolean;
}

// Input validation utilities
class InputValidator {
  static isValidCoordinate(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  static sanitizeText(text: string): string {
    if (typeof text !== 'string') return '';

    // Limit text length to prevent DoS
    if (text.length > SEARCH_CONFIG.limits.maxTextLength) {
      text = text.substring(0, SEARCH_CONFIG.limits.maxTextLength);
    }

    return text;
  }

  static isValidNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }
}

// Text processing utilities
export class TextProcessor {
  // Normalize text for searching with security measures
  static normalize(text: string): string {
    // Input validation and sanitization
    if (!text || typeof text !== 'string') return '';

    const sanitized = InputValidator.sanitizeText(text);

    try {
      return (
        sanitized
          .toLowerCase()
          .trim()
          // Use safer character replacement to prevent ReDoS
          .replace(/[^\w\s\-]/g, ' ') // Allow hyphens, more restrictive
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
      );
    } catch (error) {
      console.error('Error normalizing text:', error);
      return '';
    }
  }

  // Extract keywords from text with safety checks
  static extractKeywords(text: string): string[] {
    // Input validation
    if (!text || typeof text !== 'string') return [];

    try {
      const normalized = this.normalize(text);
      if (!normalized) return [];

      const words = normalized.split(' ').filter(word => {
        // Additional safety checks
        return (
          word &&
          typeof word === 'string' &&
          word.length >= 2 &&
          word.length <= 50 && // Prevent extremely long words
          !SEARCH_CONFIG.fullText.stopWords.includes(
            word as (typeof SEARCH_CONFIG.fullText.stopWords)[number]
          )
        );
      });

      // Limit number of keywords to prevent performance issues
      const limitedWords = words.slice(0, SEARCH_CONFIG.limits.maxQueryTerms);

      // Remove duplicates and return
      return [...new Set(limitedWords)];
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  }

  // Generate search terms with variations
  static generateSearchTerms(query: string): string[] {
    if (!query || typeof query !== 'string') return [];

    try {
      const keywords = this.extractKeywords(query);
      const terms: string[] = [...keywords];

      // Add partial matches for longer words
      keywords.forEach(keyword => {
        if (keyword && keyword.length > 4) {
          terms.push(keyword.substring(0, 4)); // Prefix matching
        }
      });

      return [...new Set(terms)];
    } catch (error) {
      console.error('Error generating search terms:', error);
      return [];
    }
  }

  // Create snippet from text with highlighted matches
  static createSnippet(
    text: string,
    query: string,
    maxLength: number = 150
  ): string {
    // Input validation
    if (!text || typeof text !== 'string') return '';
    if (!query || typeof query !== 'string')
      return text.substring(0, maxLength);

    try {
      const normalized = this.normalize(text);
      const queryTerms = this.extractKeywords(query);

      if (queryTerms.length === 0) {
        return text.substring(0, maxLength);
      }

      // Find first occurrence of any query term
      let startIndex = 0;
      for (const term of queryTerms) {
        if (term && normalized) {
          const index = normalized.indexOf(term);
          if (index !== -1) {
            startIndex = Math.max(0, index - 50);
            break;
          }
        }
      }

      // Extract snippet with bounds checking
      const endIndex = Math.min(text.length, startIndex + maxLength);
      let snippet = text.substring(startIndex, endIndex);

      // Ensure we don't cut words in half
      if (startIndex > 0) {
        const firstSpace = snippet.indexOf(' ');
        if (firstSpace > 0) {
          snippet = '...' + snippet.substring(firstSpace);
        }
      }

      if (endIndex < text.length) {
        const lastSpace = snippet.lastIndexOf(' ');
        if (lastSpace > 0) {
          snippet = snippet.substring(0, lastSpace) + '...';
        }
      }

      return snippet.trim();
    } catch (error) {
      console.error('Error creating snippet:', error);
      return text.substring(0, maxLength);
    }
  }
}

// Relevance scoring algorithms
export class RelevanceScorer {
  // Calculate relevance score for a job against search query
  static scoreJob(
    job: any,
    query: string,
    filters: EnhancedSearchFilters = {}
  ): number {
    // Input validation
    if (!job || typeof job !== 'object') return 0.1;
    if (!query || typeof query !== 'string' || !query.trim()) return 1; // Default score for no query

    try {
      const queryTerms = TextProcessor.extractKeywords(query);
      if (queryTerms.length === 0) return 1;

      let totalScore = 0;

      // Simple scoring for now
      const jobTitle = job.title || '';
      if (jobTitle.toLowerCase().includes(query.toLowerCase())) {
        totalScore += SEARCH_CONFIG.weights.titleMatch;
      }

      const jobDescription = job.description || '';
      if (jobDescription.toLowerCase().includes(query.toLowerCase())) {
        totalScore += SEARCH_CONFIG.weights.descriptionMatch;
      }

      return Math.max(totalScore, 0.1); // Minimum score
    } catch (error) {
      console.error('Error calculating job score:', error);
      return 0.1; // Fallback score
    }
  }
}

// Geolocation utilities
export class GeolocationUtils {
  // Calculate distance between two points using Haversine formula
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    // Validate all coordinates
    if (
      !InputValidator.isValidCoordinate(lat1, lng1) ||
      !InputValidator.isValidCoordinate(lat2, lng2)
    ) {
      console.error('Invalid coordinates provided to calculateDistance');
      return NaN; // Return NaN for invalid coordinates
    }

    try {
      const R = 3959; // Earth's radius in miles
      const dLat = this.toRad(lat2 - lat1);
      const dLng = this.toRad(lng2 - lng1);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRad(lat1)) *
          Math.cos(this.toRad(lat2)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance;
    } catch (error) {
      console.error('Error calculating distance:', error);
      return NaN;
    }
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Generate bounding box for efficient database queries
  static getBoundingBox(
    lat: number,
    lng: number,
    radiusMiles: number
  ): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null {
    // Validate inputs
    if (!InputValidator.isValidCoordinate(lat, lng)) {
      console.error('Invalid coordinates provided to getBoundingBox');
      return null;
    }

    if (
      !InputValidator.isValidNumber(radiusMiles) ||
      radiusMiles <= 0 ||
      radiusMiles > 1000
    ) {
      console.error('Invalid radius provided to getBoundingBox:', radiusMiles);
      return null;
    }

    try {
      const latDelta = radiusMiles / 69; // Approximate miles per degree latitude
      const cosLat = Math.cos(this.toRad(lat));

      // Prevent division by zero at poles
      if (Math.abs(cosLat) < 0.0001) {
        console.warn(
          'Coordinate too close to poles, using fallback calculation'
        );
        const lngDelta = radiusMiles / 69; // Fallback for polar regions

        return {
          minLat: Math.max(-90, lat - latDelta),
          maxLat: Math.min(90, lat + latDelta),
          minLng: Math.max(-180, lng - lngDelta),
          maxLng: Math.min(180, lng + lngDelta),
        };
      }

      const lngDelta = radiusMiles / (69 * cosLat); // Adjust for longitude

      // Validate calculations
      if (
        !InputValidator.isValidNumber(latDelta) ||
        !InputValidator.isValidNumber(lngDelta)
      ) {
        console.error('Invalid delta calculations in getBoundingBox');
        return null;
      }

      // Ensure bounds stay within valid coordinate ranges
      const result = {
        minLat: Math.max(-90, lat - latDelta),
        maxLat: Math.min(90, lat + latDelta),
        minLng: Math.max(-180, lng - lngDelta),
        maxLng: Math.min(180, lng + lngDelta),
      };

      // Validate result
      if (
        !InputValidator.isValidCoordinate(result.minLat, result.minLng) ||
        !InputValidator.isValidCoordinate(result.maxLat, result.maxLng)
      ) {
        console.error('Invalid bounding box result');
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error calculating bounding box:', error);
      return null;
    }
  }

  // Parse location string to extract coordinates (placeholder for geocoding service)
  static async geocodeLocation(
    location: string
  ): Promise<{ lat: number; lng: number } | null> {
    // In a real implementation, this would call a geocoding service like Google Maps API
    // For now, return mock coordinates for common cities
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      'san francisco': { lat: 37.7749, lng: -122.4194 },
      'new york': { lat: 40.7128, lng: -74.006 },
      'los angeles': { lat: 34.0522, lng: -118.2437 },
      chicago: { lat: 41.8781, lng: -87.6298 },
      seattle: { lat: 47.6062, lng: -122.3321 },
      austin: { lat: 30.2672, lng: -97.7431 },
      denver: { lat: 39.7392, lng: -104.9903 },
    };

    const normalizedLocation = TextProcessor.normalize(location);

    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (normalizedLocation.includes(city)) {
        return coords;
      }
    }

    return null;
  }
}

// Faceted search utilities
export class FacetedSearch {
  // Generate facets from search results with performance optimization
  static generateFacets(
    items: any[],
    searchField: string = 'jobs'
  ): Record<string, any> {
    // Input validation
    if (!Array.isArray(items)) {
      console.error('Invalid items array provided to generateFacets');
      return {};
    }

    const facets: Record<string, any> = {};

    try {
      if (searchField === 'jobs') {
        // Simple facet generation for now
        facets.jobTypes = [];
        facets.companies = [];
        facets.locations = [];
        facets.salaryRanges = [];
        facets.recency = [];
        facets.remote = [];
      }

      return facets;
    } catch (error) {
      console.error('Error generating facets:', error);
      return {};
    }
  }
}

// Export a simple search function for now
export function performSearch<T>(items: T[], query: string): SearchResult<T>[] {
  if (!query || !Array.isArray(items)) {
    return items.map(item => ({
      item,
      relevanceScore: 1,
      matchedFields: [],
    }));
  }

  const keywords = TextProcessor.extractKeywords(query);

  return items.map(item => ({
    item,
    relevanceScore: 1, // Simple scoring for now
    matchedFields: [],
  }));
}
