import { cn, formatDate, absoluteUrl, truncate, getGitHubStars } from '../utils';

// Mock fetch for getGitHubStars tests
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('px-2 py-1', 'text-red-500')).toBe('px-2 py-1 text-red-500');
    });

    it('handles conditional classes', () => {
      expect(cn('px-2', true && 'py-1', false && 'text-red-500')).toBe('px-2 py-1');
    });

    it('handles Tailwind conflicts correctly', () => {
      expect(cn('px-2 px-4')).toBe('px-4');
      expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
    });

    it('handles arrays of classes', () => {
      expect(cn(['px-2', 'py-1'], 'text-red-500')).toBe('px-2 py-1 text-red-500');
    });

    it('handles objects with conditional classes', () => {
      expect(cn({
        'px-2': true,
        'py-1': false,
        'text-red-500': true
      })).toBe('px-2 text-red-500');
    });

    it('handles empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn(null, undefined, false)).toBe('');
    });

    it('handles complex combinations', () => {
      expect(cn(
        'px-2 py-1',
        { 'text-red-500': true, 'bg-blue-500': false },
        ['font-bold', 'text-lg'],
        true && 'hover:bg-gray-100'
      )).toBe('px-2 py-1 text-red-500 font-bold text-lg hover:bg-gray-100');
    });
  });

  describe('formatDate', () => {
    it('formats Date object correctly', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('January 15, 2024');
    });

    it('formats date string correctly', () => {
      expect(formatDate('2024-01-15')).toBe('January 15, 2024');
    });

    it('formats timestamp correctly', () => {
      const timestamp = new Date('2024-01-15').getTime();
      expect(formatDate(timestamp)).toBe('January 15, 2024');
    });

    it('handles different months correctly', () => {
      expect(formatDate('2024-12-25')).toBe('December 25, 2024');
      expect(formatDate('2024-06-01')).toBe('June 1, 2024');
    });

    it('handles leap year correctly', () => {
      expect(formatDate('2024-02-29')).toBe('February 29, 2024');
    });

    it('handles invalid dates gracefully', () => {
      expect(() => formatDate('invalid-date')).toThrow();
    });

    it('handles edge case dates', () => {
      expect(formatDate('2024-01-01')).toBe('January 1, 2024');
      expect(formatDate('2024-12-31')).toBe('December 31, 2024');
    });
  });

  describe('absoluteUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('creates absolute URL with base URL from environment', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      expect(absoluteUrl('/api/jobs')).toBe('https://example.com/api/jobs');
    });

    it('handles paths without leading slash', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      expect(absoluteUrl('api/jobs')).toBe('https://example.comapi/jobs');
    });

    it('handles empty base URL', () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      expect(absoluteUrl('/api/jobs')).toBe('/api/jobs');
    });

    it('handles root path', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      expect(absoluteUrl('/')).toBe('https://example.com/');
    });

    it('handles empty path', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      expect(absoluteUrl('')).toBe('https://example.com');
    });

    it('handles base URL with trailing slash', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com/';
      expect(absoluteUrl('/api/jobs')).toBe('https://example.com//api/jobs');
    });

    it('handles complex paths', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      expect(absoluteUrl('/api/jobs?query=developer&location=sf')).toBe('https://example.com/api/jobs?query=developer&location=sf');
    });
  });

  describe('truncate', () => {
    it('truncates string longer than specified length', () => {
      expect(truncate('This is a very long string', 10)).toBe('This is a ...');
    });

    it('returns original string if shorter than length', () => {
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('returns original string if equal to length', () => {
      expect(truncate('Exactly10!', 10)).toBe('Exactly10!');
    });

    it('handles empty string', () => {
      expect(truncate('', 10)).toBe('');
    });

    it('handles zero length', () => {
      expect(truncate('Hello', 0)).toBe('...');
    });

    it('handles negative length', () => {
      expect(truncate('Hello', -5)).toBe('...');
    });

    it('handles single character', () => {
      expect(truncate('Hello', 1)).toBe('H...');
    });

    it('handles very long strings', () => {
      const longString = 'a'.repeat(1000);
      const result = truncate(longString, 50);
      expect(result).toBe('a'.repeat(50) + '...');
      expect(result.length).toBe(53);
    });

    it('handles strings with special characters', () => {
      expect(truncate('Hello 🌟 World! 🎉', 10)).toBe('Hello 🌟 W...');
    });

    it('handles unicode characters correctly', () => {
      expect(truncate('Héllo Wörld', 8)).toBe('Héllo Wö...');
    });
  });

  describe('getGitHubStars', () => {
    it('returns star count on successful API call', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ stargazers_count: 42 })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await getGitHubStars();
      
      expect(result).toBe(42);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/pjborowiecki/SAASY-LAND-Next-14-Starters-With-Authentication-And-Database-Implemented',
        {
          headers: {
            Accept: 'application/vnd.github+json',
          },
          next: {
            revalidate: 60,
          },
        }
      );
    });

    it('returns null on API error response', async () => {
      const mockResponse = {
        ok: false,
        status: 404
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await getGitHubStars();
      
      expect(result).toBeNull();
    });

    it('returns null on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getGitHubStars();
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(new Error('Network error'));
      
      consoleSpy.mockRestore();
    });

    it('returns null on JSON parsing error', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      };
      mockFetch.mockResolvedValue(mockResponse as any);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getGitHubStars();
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(new Error('Invalid JSON'));
      
      consoleSpy.mockRestore();
    });

    it('handles missing stargazers_count in response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({})
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await getGitHubStars();
      
      expect(result).toBeUndefined();
    });

    it('handles zero stars correctly', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ stargazers_count: 0 })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await getGitHubStars();
      
      expect(result).toBe(0);
    });

    it('handles large star counts', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ stargazers_count: 999999 })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await getGitHubStars();
      
      expect(result).toBe(999999);
    });
  });
}); 