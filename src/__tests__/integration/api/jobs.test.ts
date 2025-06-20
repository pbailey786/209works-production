/**
 * Integration Tests for Jobs API
 * Tests the complete job management API endpoints
 */

import { createMocks } from 'node-mocks-http';
import { GET, POST, PUT, DELETE } from '@/app/api/jobs/route';
import { GET as GetJobById, PUT as UpdateJob, DELETE as DeleteJob } from '@/app/api/jobs/[id]/route';
import { testDb, mockFactories, mockServices } from '@/__tests__/utils/test-helpers';
import { prismaMock } from '@/__tests__/utils/test-helpers';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({
    userId: 'test-clerk-user-id',
  })),
}));

// Mock Prisma
jest.mock('@/lib/database/prisma', () => ({
  prisma: prismaMock,
}));

describe('/api/jobs', () => {
  beforeEach(async () => {
    await testDb.reset();
    jest.clearAllMocks();
  });

  describe('GET /api/jobs', () => {
    it('should return paginated jobs list', async () => {
      const mockJobs = Array.from({ length: 15 }, () => mockFactories.job());
      prismaMock.job.findMany.mockResolvedValue(mockJobs.slice(0, 10));
      prismaMock.job.count.mockResolvedValue(15);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/jobs?page=1&limit=10',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.jobs).toHaveLength(10);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        totalCount: 15,
        totalPages: 2,
        hasNext: true,
        hasPrev: false,
      });
    });

    it('should filter jobs by location', async () => {
      const stocktonJobs = Array.from({ length: 5 }, () => 
        mockFactories.job({ location: 'Stockton, CA' })
      );
      prismaMock.job.findMany.mockResolvedValue(stocktonJobs);
      prismaMock.job.count.mockResolvedValue(5);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/jobs?location=Stockton',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobs).toHaveLength(5);
      expect(data.jobs.every((job: any) => job.location.includes('Stockton'))).toBe(true);
    });

    it('should filter jobs by salary range', async () => {
      const highPayingJobs = Array.from({ length: 3 }, () => 
        mockFactories.job({ salaryMin: 80000, salaryMax: 120000 })
      );
      prismaMock.job.findMany.mockResolvedValue(highPayingJobs);
      prismaMock.job.count.mockResolvedValue(3);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/jobs?salaryMin=75000',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobs).toHaveLength(3);
      expect(data.jobs.every((job: any) => job.salaryMin >= 75000)).toBe(true);
    });

    it('should search jobs by keywords', async () => {
      const engineerJobs = Array.from({ length: 4 }, () => 
        mockFactories.job({ title: 'Software Engineer' })
      );
      prismaMock.job.findMany.mockResolvedValue(engineerJobs);
      prismaMock.job.count.mockResolvedValue(4);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/jobs?search=engineer',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobs).toHaveLength(4);
      expect(data.jobs.every((job: any) => 
        job.title.toLowerCase().includes('engineer')
      )).toBe(true);
    });

    it('should handle empty results', async () => {
      prismaMock.job.findMany.mockResolvedValue([]);
      prismaMock.job.count.mockResolvedValue(0);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/jobs?search=nonexistent',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobs).toHaveLength(0);
      expect(data.pagination.totalCount).toBe(0);
    });
  });

  describe('POST /api/jobs', () => {
    const mockUser = mockFactories.user({ role: 'employer' });

    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
    });

    it('should create a new job with valid data', async () => {
      const newJob = mockFactories.job();
      prismaMock.job.create.mockResolvedValue(newJob);

      const { req } = createMocks({
        method: 'POST',
        body: {
          title: newJob.title,
          company: newJob.company,
          description: newJob.description,
          location: newJob.location,
          salaryMin: newJob.salaryMin,
          salaryMax: newJob.salaryMax,
          jobType: newJob.jobType,
          experienceLevel: newJob.experienceLevel,
          skills: newJob.skills,
          benefits: newJob.benefits,
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.job).toHaveValidJobData();
      expect(data.job.title).toBe(newJob.title);
    });

    it('should reject job creation with invalid data', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          title: '', // Invalid: empty title
          company: 'Test Company',
          description: 'Test description',
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });

    it('should reject job creation for non-employers', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        mockFactories.user({ role: 'job_seeker' })
      );

      const { req } = createMocks({
        method: 'POST',
        body: mockFactories.job(),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('permission');
    });

    it('should handle database errors gracefully', async () => {
      prismaMock.job.create.mockRejectedValue(new Error('Database connection failed'));

      const { req } = createMocks({
        method: 'POST',
        body: mockFactories.job(),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to create job');
    });
  });

  describe('GET /api/jobs/[id]', () => {
    it('should return job details by ID', async () => {
      const mockJob = mockFactories.job();
      prismaMock.job.findUnique.mockResolvedValue(mockJob);

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await GetJobById(req, { params: { id: mockJob.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.job).toHaveValidJobData();
      expect(data.job.id).toBe(mockJob.id);
    });

    it('should return 404 for non-existent job', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await GetJobById(req, { params: { id: 'non-existent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should increment view count when job is viewed', async () => {
      const mockJob = mockFactories.job();
      prismaMock.job.findUnique.mockResolvedValue(mockJob);
      prismaMock.job.update.mockResolvedValue({ ...mockJob, viewCount: mockJob.viewCount + 1 });

      const { req } = createMocks({
        method: 'GET',
      });

      await GetJobById(req, { params: { id: mockJob.id } });

      expect(prismaMock.job.update).toHaveBeenCalledWith({
        where: { id: mockJob.id },
        data: { viewCount: { increment: 1 } },
      });
    });
  });

  describe('PUT /api/jobs/[id]', () => {
    const mockUser = mockFactories.user({ role: 'employer' });
    const mockJob = mockFactories.job({ employerId: mockUser.id });

    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.job.findUnique.mockResolvedValue(mockJob);
    });

    it('should update job with valid data', async () => {
      const updatedJob = { ...mockJob, title: 'Updated Job Title' };
      prismaMock.job.update.mockResolvedValue(updatedJob);

      const { req } = createMocks({
        method: 'PUT',
        body: {
          title: 'Updated Job Title',
          description: 'Updated description',
        },
      });

      const response = await UpdateJob(req, { params: { id: mockJob.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.job.title).toBe('Updated Job Title');
    });

    it('should reject updates from non-owners', async () => {
      const otherUser = mockFactories.user({ role: 'employer' });
      prismaMock.user.findUnique.mockResolvedValue(otherUser);

      const { req } = createMocks({
        method: 'PUT',
        body: { title: 'Unauthorized Update' },
      });

      const response = await UpdateJob(req, { params: { id: mockJob.id } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('permission');
    });
  });

  describe('DELETE /api/jobs/[id]', () => {
    const mockUser = mockFactories.user({ role: 'employer' });
    const mockJob = mockFactories.job({ employerId: mockUser.id });

    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.job.findUnique.mockResolvedValue(mockJob);
    });

    it('should delete job successfully', async () => {
      prismaMock.job.delete.mockResolvedValue(mockJob);

      const { req } = createMocks({
        method: 'DELETE',
      });

      const response = await DeleteJob(req, { params: { id: mockJob.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted');
    });

    it('should reject deletion from non-owners', async () => {
      const otherUser = mockFactories.user({ role: 'employer' });
      prismaMock.user.findUnique.mockResolvedValue(otherUser);

      const { req } = createMocks({
        method: 'DELETE',
      });

      const response = await DeleteJob(req, { params: { id: mockJob.id } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('permission');
    });

    it('should handle soft delete for jobs with applications', async () => {
      const jobWithApplications = { ...mockJob, _count: { jobApplications: 5 } };
      prismaMock.job.findUnique.mockResolvedValue(jobWithApplications);
      prismaMock.job.update.mockResolvedValue({ ...jobWithApplications, status: 'DELETED' });

      const { req } = createMocks({
        method: 'DELETE',
      });

      const response = await DeleteJob(req, { params: { id: mockJob.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prismaMock.job.update).toHaveBeenCalledWith({
        where: { id: mockJob.id },
        data: { status: 'DELETED' },
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large job listings efficiently', async () => {
      const largeJobList = Array.from({ length: 1000 }, () => mockFactories.job());
      prismaMock.job.findMany.mockResolvedValue(largeJobList.slice(0, 50));
      prismaMock.job.count.mockResolvedValue(1000);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/jobs?limit=50',
      });

      const startTime = performance.now();
      const response = await GET(req);
      const endTime = performance.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent job creation requests', async () => {
      const mockUser = mockFactories.user({ role: 'employer' });
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const jobPromises = Array.from({ length: 10 }, (_, i) => {
        const newJob = mockFactories.job();
        prismaMock.job.create.mockResolvedValueOnce(newJob);

        const { req } = createMocks({
          method: 'POST',
          body: newJob,
        });

        return POST(req);
      });

      const responses = await Promise.all(jobPromises);
      
      expect(responses.every(res => res.status === 201)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed request bodies', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle database connection failures', async () => {
      prismaMock.job.findMany.mockRejectedValue(new Error('Connection timeout'));

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to fetch jobs');
    });
  });
});
