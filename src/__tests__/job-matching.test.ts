import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { 
  EnhancedJobMatchingService,
  findMatchingJobs,
  calculateMatchQuality,
  generateOptimizationRecommendations
} from '../lib/search/job-matching';
import { AlertCriteria } from '../lib/search/job-matching';

// Mock Redis cache
jest.mock('../lib/cache/redis', () => ({
  getCache: jest.fn(() => Promise.resolve(null)),
  setCache: jest.fn(() => Promise.resolve(true)),
  generateCacheKey: jest.fn(() => 'test-cache-key'),
  CACHE_PREFIXES: { search: 'search' },
  DEFAULT_TTL: { short: 300 },
}));

// Mock Prisma
jest.mock('../app/api/auth/prisma', () => ({
  prisma: {
    job: {
      findMany: jest.fn(),
    },
  },
}));

describe('Enhanced Job Matching Algorithm', () => {
  const mockJobs = [
    {
      id: '1',
      title: 'Senior React Developer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      type: 'full_time',
      salaryMin: 120000,
      salaryMax: 160000,
      description: 'We are looking for an experienced React developer to join our frontend team. You will work with modern JavaScript, TypeScript, and React ecosystem.',
      categories: ['technology', 'frontend'],
      createdAt: new Date(),
      skills: ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS'],
      experienceLevel: 'senior',
      isRemote: false,
    },
    {
      id: '2',
      title: 'Full Stack Engineer - Remote',
      company: 'StartupXYZ',
      location: 'Remote',
      type: 'full_time',
      salaryMin: 90000,
      salaryMax: 130000,
      description: 'Join our remote team as a Full Stack Engineer. Work with React, Node.js, and cloud technologies.',
      categories: ['technology', 'fullstack'],
      createdAt: new Date(),
      skills: ['React', 'Node.js', 'JavaScript', 'AWS', 'PostgreSQL'],
      experienceLevel: 'mid',
      isRemote: true,
    },
    {
      id: '3',
      title: 'Junior Python Developer',
      company: 'DataLabs',
      location: 'Austin, TX',
      type: 'full_time',
      salaryMin: 65000,
      salaryMax: 85000,
      description: 'Entry-level Python developer position. You will work on data processing and web applications using Django.',
      categories: ['technology', 'backend', 'python'],
      createdAt: new Date(),
      skills: ['Python', 'Django', 'SQL', 'Git'],
      experienceLevel: 'junior',
      isRemote: false,
    },
    {
      id: '4',
      title: 'DevOps Engineer',
      company: 'CloudFirst',
      location: 'Seattle, WA',
      type: 'full_time',
      salaryMin: 110000,
      salaryMax: 140000,
      description: 'DevOps Engineer to manage cloud infrastructure with AWS, Kubernetes, and CI/CD pipelines.',
      categories: ['technology', 'devops', 'cloud'],
      createdAt: new Date(),
      skills: ['AWS', 'Kubernetes', 'Docker', 'Linux', 'Terraform'],
      experienceLevel: 'senior',
      isRemote: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Prisma to return our test jobs
    const { prisma } = require('../app/api/auth/prisma');
    prisma.job.findMany.mockResolvedValue(mockJobs);
  });

  describe('EnhancedJobMatchingService.findMatchingJobs', () => {
    it('should find matching jobs based on keywords', async () => {
      const criteria = {
        keywords: ['React', 'JavaScript'],
        location: 'San Francisco',
      };

      const results = await findMatchingJobs(criteria, 10);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      // Should find React-related jobs
      const reactJobs = results.filter(job => 
        job.title.toLowerCase().includes('react') || 
        job.skills?.includes('React')
      );
      expect(reactJobs.length).toBeGreaterThan(0);
    });

    it('should score jobs with semantic matching', async () => {
      const criteria = {
        keywords: ['React'],
        skills: ['JavaScript', 'TypeScript'],
        experienceLevel: 'senior',
      };

      const results = await findMatchingJobs(criteria, 10);

      // Check that jobs have relevance scores
      results.forEach(job => {
        expect(job.relevanceScore).toBeDefined();
        expect(typeof job.relevanceScore).toBe('number');
        expect(job.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(job.relevanceScore).toBeLessThanOrEqual(100);
      });

      // Senior React job should have high relevance
      const seniorReactJob = results.find(job => 
        job.title.includes('Senior React')
      );
      if (seniorReactJob) {
        expect(seniorReactJob.relevanceScore).toBeGreaterThan(70);
      }
    });

    it('should handle location-based matching', async () => {
      const criteria = {
        location: 'Remote',
        remote: true,
      };

      const results = await findMatchingJobs(criteria, 10);

      // Should find remote jobs with higher location scores
      const remoteJobs = results.filter(job => job.isRemote);
      expect(remoteJobs.length).toBeGreaterThan(0);
      
      remoteJobs.forEach(job => {
        expect(job.locationScore).toBeGreaterThan(0.5);
      });
    });

    it('should match skills accurately', async () => {
      const criteria = {
        skills: ['React', 'Node.js'],
      };

      const results = await findMatchingJobs(criteria, 10);

      // Jobs with matching skills should have higher skills scores
      results.forEach(job => {
        if (job.skills?.some(skill => ['React', 'Node.js'].includes(skill))) {
          expect(job.skillsScore).toBeGreaterThan(0.3);
        }
      });
    });

    it('should handle salary range filtering', async () => {
      const criteria = {
        salaryMin: 100000,
        salaryMax: 150000,
      };

      const results = await findMatchingJobs(criteria, 10);

      // Should find jobs with overlapping salary ranges
      results.forEach(job => {
        // Job should have some salary overlap with criteria
        expect(
          (job.salaryMin && job.salaryMin <= 150000) ||
          (job.salaryMax && job.salaryMax >= 100000)
        ).toBe(true);
      });
    });

    it('should handle experience level matching', async () => {
      const criteria = {
        experienceLevel: 'senior',
      };

      const results = await findMatchingJobs(criteria, 10);

      // Senior jobs should be found in results
      const seniorJobs = results.filter(job => 
        job.title.toLowerCase().includes('senior')
      );
      
      expect(seniorJobs.length).toBeGreaterThan(0);
    });

    it('should exclude jobs with unwanted keywords', async () => {
      const criteria = {
        keywords: ['Developer'],
        excludeKeywords: ['Junior'],
      };

      const results = await findMatchingJobs(criteria, 10);

      // Should not find jobs with "Junior" in title when excluded
      const juniorJobs = results.filter(job => 
        job.title.toLowerCase().includes('junior')
      );
      expect(juniorJobs.length).toBe(0);
    });

    it('should generate meaningful snippets', async () => {
      const criteria = {
        keywords: ['React', 'JavaScript'],
      };

      const results = await findMatchingJobs(criteria, 10);

      results.forEach(job => {
        if (job.snippet) {
          expect(typeof job.snippet).toBe('string');
          expect(job.snippet.length).toBeGreaterThan(0);
          expect(job.snippet.length).toBeLessThanOrEqual(200);
        }
      });
    });

    it('should find matching jobs for basic criteria', async () => {
      const criteria: AlertCriteria = {
        keywords: ['developer', 'javascript'],
        location: 'New York',
        jobType: 'full-time',
        salaryMin: 50000,
        salaryMax: 100000,
      };
      const result = await findMatchingJobs(criteria, 10);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should find matching jobs for location-based criteria', async () => {
      const criteria: AlertCriteria = {
        keywords: ['engineer'],
        location: 'San Francisco',
      };
      const result = await findMatchingJobs(criteria, 5);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('calculateMatchQuality', () => {
    it('should return no_matches for empty results', () => {
      const criteria = { keywords: ['test'] };
      const jobs: any[] = [];

      const quality = calculateMatchQuality(criteria, jobs);

      expect(quality.level).toBe('no_matches');
      expect(quality.score).toBe(0);
      expect(quality.feedback).toContain('No jobs found');
      expect(quality.improvements).toHaveLength(4);
    });

    it('should calculate excellent quality for high-scoring jobs', () => {
      const criteria = { keywords: ['React'] };
      const jobs = [
        { 
          id: '1', title: 'React Developer', company: 'TechCorp', location: 'SF', 
          jobType: 'full_time', description: 'React job', createdAt: new Date(),
          relevanceScore: 95, matchedFields: ['title', 'skills'] 
        },
        { 
          id: '2', title: 'Frontend Dev', company: 'StartupXYZ', location: 'Remote', 
          jobType: 'full_time', description: 'Frontend job', createdAt: new Date(),
          relevanceScore: 88, matchedFields: ['title', 'description'] 
        },
        { 
          id: '3', title: 'UI Developer', company: 'DataLabs', location: 'Austin', 
          jobType: 'full_time', description: 'UI job', createdAt: new Date(),
          relevanceScore: 92, matchedFields: ['skills'] 
        },
      ];

      const quality = calculateMatchQuality(criteria, jobs);

      expect(quality.level).toBe('excellent');
      expect(quality.score).toBeGreaterThan(80);
      expect(quality.feedback).toContain('Excellent matches');
      expect(quality.distribution.excellent).toBe(3);
    });

    it('should calculate fair quality for medium-scoring jobs', () => {
      const criteria = { keywords: ['test'] };
      const jobs = [
        { 
          id: '1', title: 'Test Engineer', company: 'TechCorp', location: 'SF', 
          jobType: 'full_time', description: 'Test job', createdAt: new Date(),
          relevanceScore: 45, matchedFields: ['title'] 
        },
        { 
          id: '2', title: 'QA Engineer', company: 'StartupXYZ', location: 'Remote', 
          jobType: 'full_time', description: 'QA job', createdAt: new Date(),
          relevanceScore: 52, matchedFields: ['description'] 
        },
        { 
          id: '3', title: 'Software Tester', company: 'DataLabs', location: 'Austin', 
          jobType: 'full_time', description: 'Testing job', createdAt: new Date(),
          relevanceScore: 48, matchedFields: ['title'] 
        },
      ];

      const quality = calculateMatchQuality(criteria, jobs);

      expect(quality.level).toBe('fair');
      expect(quality.score).toBeGreaterThanOrEqual(40);
      expect(quality.score).toBeLessThan(60);
      expect(quality.feedback).toContain('Some relevant matches');
    });

    it('should provide distribution statistics', () => {
      const criteria = { keywords: ['test'] };
      const jobs = [
        { 
          id: '1', title: 'Test Engineer', company: 'TechCorp', location: 'SF', 
          jobType: 'full_time', description: 'Test job', createdAt: new Date(),
          relevanceScore: 85, matchedFields: ['title'] 
        }, // excellent
        { 
          id: '2', title: 'QA Engineer', company: 'StartupXYZ', location: 'Remote', 
          jobType: 'full_time', description: 'QA job', createdAt: new Date(),
          relevanceScore: 75, matchedFields: ['title'] 
        }, // good
        { 
          id: '3', title: 'Software Tester', company: 'DataLabs', location: 'Austin', 
          jobType: 'full_time', description: 'Testing job', createdAt: new Date(),
          relevanceScore: 55, matchedFields: ['title'] 
        }, // fair
        { 
          id: '4', title: 'Junior Tester', company: 'SmallCorp', location: 'Local', 
          jobType: 'part_time', description: 'Entry test job', createdAt: new Date(),
          relevanceScore: 25, matchedFields: ['title'] 
        }, // poor
      ];

      const quality = calculateMatchQuality(criteria, jobs);

      expect(quality.distribution.total).toBe(4);
      expect(quality.distribution.excellent).toBe(1);
      expect(quality.distribution.good).toBe(1);
      expect(quality.distribution.fair).toBe(1);
      expect(quality.distribution.poor).toBe(1);
    });

    it('should suggest improvements based on criteria', () => {
      const criteria = { 
        keywords: ['test'],
        // Missing skills and excludeKeywords
      };
      const jobs = [
        { 
          id: '1', title: 'Test Engineer', company: 'TechCorp', location: 'SF', 
          jobType: 'full_time', description: 'Test job', createdAt: new Date(),
          relevanceScore: 60, matchedFields: ['title'] 
        },
      ];

      const quality = calculateMatchQuality(criteria, jobs);

      expect(quality.improvements).toContain('Add relevant skills to improve matching accuracy');
      expect(quality.improvements).toContain('Use exclude keywords to filter out irrelevant jobs');
    });
  });

  describe('generateOptimizationRecommendations', () => {
    it('should recommend broadening search for no results', () => {
      const criteria = {
        keywords: ['VerySpecificTechnology'],
        location: 'SmallCity',
        salaryMin: 200000,
      };
      const jobs: any[] = [];

      const recommendations = generateOptimizationRecommendations(criteria, jobs);

      expect(recommendations).toContain('Consider removing or broadening location restrictions');
      expect(recommendations).toContain('Try using broader keywords or job titles');
      expect(recommendations).toContain('Consider lowering minimum salary requirements');
    });

    it('should recommend narrowing search for too many results', () => {
      const criteria = {
        keywords: ['Developer'],
      };
      const jobs = Array(60).fill(null).map((_, i) => ({
        id: i.toString(),
        title: `Developer ${i}`,
        company: 'TechCorp',
        location: 'SF',
        jobType: 'full_time',
        description: 'Developer job',
        createdAt: new Date(),
        relevanceScore: 50,
        matchedFields: ['title'],
      }));

      const recommendations = generateOptimizationRecommendations(criteria, jobs);

      expect(recommendations).toContain('Add more specific keywords to narrow results');
      expect(recommendations).toContain('Consider adding location or experience level filters');
    });

    it('should recommend keyword improvements for low relevance', () => {
      const criteria = {
        keywords: ['test'],
      };
      const jobs = [
        { 
          id: '1', title: 'Test Engineer', company: 'TechCorp', location: 'SF', 
          jobType: 'full_time', description: 'Test job', createdAt: new Date(),
          relevanceScore: 40, matchedFields: ['title'] 
        },
        { 
          id: '2', title: 'QA Engineer', company: 'StartupXYZ', location: 'Remote', 
          jobType: 'full_time', description: 'QA job', createdAt: new Date(),
          relevanceScore: 45, matchedFields: ['description'] 
        },
      ];

      const recommendations = generateOptimizationRecommendations(criteria, jobs);

      expect(recommendations).toContain('Review keywords for better relevance');
    });

    it('should recommend skills adjustments for poor skill matching', () => {
      const criteria = {
        skills: ['VeryRareSkill', 'AnotherRareSkill'],
      };
      const jobs = [
        { 
          id: '1', title: 'Engineer', company: 'TechCorp', location: 'SF', 
          jobType: 'full_time', description: 'Engineering job', createdAt: new Date(),
          relevanceScore: 60, matchedFields: ['title'] 
        }, // No skills match
        { 
          id: '2', title: 'Developer', company: 'StartupXYZ', location: 'Remote', 
          jobType: 'full_time', description: 'Development job', createdAt: new Date(),
          relevanceScore: 65, matchedFields: ['title'] 
        },
      ];

      const recommendations = generateOptimizationRecommendations(criteria, jobs);

      expect(recommendations).toContain('Consider adjusting skill requirements for better matches');
    });

    it('should recommend location improvements for poor location matching', () => {
      const criteria = {
        location: 'Specific City',
      };
      const jobs = [
        { 
          id: '1', title: 'Local Engineer', company: 'TechCorp', location: 'Different City', 
          jobType: 'full_time', description: 'Local job', createdAt: new Date(),
          relevanceScore: 60, matchedFields: ['title'], isRemote: false 
        },
        { 
          id: '2', title: 'Onsite Developer', company: 'StartupXYZ', location: 'Another City', 
          jobType: 'full_time', description: 'Onsite job', createdAt: new Date(),
          relevanceScore: 65, matchedFields: ['title'], isRemote: false 
        },
      ];

      const recommendations = generateOptimizationRecommendations(criteria, jobs);

      expect(recommendations).toContain('Consider expanding location search or including remote jobs');
    });

    it('should limit recommendations to top 5', () => {
      const criteria = {
        keywords: ['test'],
      };
      const jobs: any[] = []; // Empty to trigger many recommendations

      const recommendations = generateOptimizationRecommendations(criteria, jobs);

      expect(recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null or undefined criteria gracefully', async () => {
      const results = await findMatchingJobs({}, 10);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle empty skills array', async () => {
      const criteria = {
        skills: [],
        keywords: ['test'],
      };

      const results = await findMatchingJobs(criteria, 10);
      expect(results).toBeDefined();
    });

    it('should handle invalid salary ranges', async () => {
      const criteria = {
        salaryMin: 200000,
        salaryMax: 50000, // Invalid: min > max
      };

      const results = await findMatchingJobs(criteria, 10);
      expect(results).toBeDefined();
    });

    it('should handle very long keyword lists', async () => {
      const criteria = {
        keywords: Array(50).fill('technology'), // 50 identical keywords
      };

      const results = await findMatchingJobs(criteria, 10);
      expect(results).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should complete matching within reasonable time', async () => {
      const startTime = Date.now();
      
      const criteria = {
        keywords: ['Developer', 'Engineer'],
        skills: ['JavaScript', 'Python'],
        location: 'San Francisco',
        salaryMin: 80000,
        salaryMax: 150000,
      };

      await findMatchingJobs(criteria, 50);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle large result sets efficiently', async () => {
      // Mock a large dataset
      const { prisma } = require('../app/api/auth/prisma');
      const largeJobSet = Array(500).fill(null).map((_, i) => ({
        ...mockJobs[0],
        id: i.toString(),
        title: `Job ${i}`,
      }));
      prisma.job.findMany.mockResolvedValue(largeJobSet);

      const criteria = { keywords: ['Job'] };
      const results = await findMatchingJobs(criteria, 100);

      expect(results).toBeDefined();
      expect(results.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Caching Behavior', () => {
    it('should use cache when available', async () => {
      const { getCache } = require('../lib/cache/redis');
      const cachedResults = [{ id: 'cached', title: 'Cached Job' }];
      getCache.mockResolvedValueOnce(cachedResults);

      const criteria = { keywords: ['test'] };
      const results = await findMatchingJobs(criteria, 10);

      expect(results).toEqual(cachedResults);
      expect(getCache).toHaveBeenCalledWith('test-cache-key');
    });

    it('should set cache for new results', async () => {
      const { setCache } = require('../lib/cache/redis');
      
      const criteria = { keywords: ['React'] };
      await findMatchingJobs(criteria, 10);

      expect(setCache).toHaveBeenCalled();
    });
  });
}); 