import { 
  createMockJob, 
  createMockUser, 
  createMockJobs,
  mockApiResponse,
  mockPaginatedResponse,
  assertJobStructure,
  assertUserStructure,
  assertApiResponse,
  assertPaginatedResponse
} from './index'

describe('Test Utilities', () => {
  describe('Mock Data Factories', () => {
    it('should create a valid mock job', () => {
      const job = createMockJob()
      assertJobStructure(job)
      expect(job.title).toBe('Software Engineer')
      expect(job.company).toBe('Tech Corp')
    })

    it('should create a mock job with overrides', () => {
      const job = createMockJob({ 
        title: 'Senior Developer',
        salaryMin: 100000,
        salaryMax: 150000
      })
      
      expect(job.title).toBe('Senior Developer')
      expect(job.salaryMin).toBe(100000)
      expect(job.salaryMax).toBe(150000)
      assertJobStructure(job)
    })

    it('should create multiple mock jobs', () => {
      const jobs = createMockJobs(3)
      expect(jobs).toHaveLength(3)
      jobs.forEach(job => assertJobStructure(job))
      
      // Check that IDs are unique
      const ids = jobs.map(job => job.id)
      expect(new Set(ids).size).toBe(3)
    })

    it('should create a valid mock user', () => {
      const user = createMockUser()
      assertUserStructure(user)
      expect(user.email).toBeValidEmail()
    })
  })

  describe('API Response Helpers', () => {
    it('should create a successful API response', () => {
      const response = mockApiResponse({ message: 'Success' })
      assertApiResponse(response, true)
      expect(response.data.message).toBe('Success')
    })

    it('should create an error API response', () => {
      const response = mockApiResponse(null, false)
      assertApiResponse(response, false)
      expect(response.error).toBeDefined()
    })

    it('should create a paginated response', () => {
      const data = createMockJobs(5)
      const response = mockPaginatedResponse(data, 1, 3, 10)
      
      assertPaginatedResponse(response)
      expect(response.data).toHaveLength(5)
      expect(response.pagination.page).toBe(1)
      expect(response.pagination.limit).toBe(3)
      expect(response.pagination.total).toBe(10)
      expect(response.pagination.totalPages).toBe(4)
      expect(response.pagination.hasNext).toBe(true)
      expect(response.pagination.hasPrev).toBe(false)
    })
  })

  describe('Custom Matchers', () => {
    it('should validate emails correctly', () => {
      expect('test@example.com').toBeValidEmail()
      expect('invalid-email').not.toBeValidEmail()
    })

    it('should validate URLs correctly', () => {
      expect('https://example.com').toBeValidUrl()
      expect('invalid-url').not.toBeValidUrl()
    })

    it('should validate job types correctly', () => {
      expect('Full-time').toBeValidJobType()
      expect('Invalid Type').not.toBeValidJobType()
    })

    it('should validate salary ranges correctly', () => {
      expect({ salaryMin: 50000, salaryMax: 80000 }).toHaveValidSalaryRange()
      expect({ salaryMin: 80000, salaryMax: 50000 }).not.toHaveValidSalaryRange()
    })

    it('should validate date ranges correctly', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')
      const testDate = new Date('2024-06-15')
      const outsideDate = new Date('2025-01-01')
      
      expect(testDate).toBeWithinDateRange(startDate, endDate)
      expect(outsideDate).not.toBeWithinDateRange(startDate, endDate)
    })
  })
}) 