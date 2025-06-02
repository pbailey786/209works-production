import { expect } from '@jest/globals'

// Extend Jest matchers
declare module '@jest/expect' {
  interface Matchers<R> {
    toBeValidEmail(): R
    toBeValidUrl(): R
    toBeValidJobType(): R
    toHaveValidSalaryRange(): R
    toBeWithinDateRange(startDate: Date, endDate: Date): R
  }
}

// Custom matchers
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pass = emailRegex.test(received)
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      }
    }
  },

  toBeValidUrl(received: string) {
    try {
      new URL(received)
      return {
        message: () => `expected ${received} not to be a valid URL`,
        pass: true,
      }
    } catch {
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: false,
      }
    }
  },

  toBeValidJobType(received: string) {
    const validJobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Temporary']
    const pass = validJobTypes.includes(received)
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid job type`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid job type. Valid types: ${validJobTypes.join(', ')}`,
        pass: false,
      }
    }
  },

  toHaveValidSalaryRange(received: { salaryMin?: number; salaryMax?: number }) {
    const { salaryMin, salaryMax } = received
    
    if (salaryMin !== undefined && salaryMax !== undefined) {
      const pass = salaryMin <= salaryMax && salaryMin >= 0 && salaryMax >= 0
      
      if (pass) {
        return {
          message: () => `expected salary range ${salaryMin}-${salaryMax} to be invalid`,
          pass: true,
        }
      } else {
        return {
          message: () => `expected salary range to be valid (min: ${salaryMin}, max: ${salaryMax})`,
          pass: false,
        }
      }
    }
    
    return {
      message: () => `expected object to have both salaryMin and salaryMax properties`,
      pass: false,
    }
  },

  toBeWithinDateRange(received: string | Date, startDate: Date, endDate: Date) {
    const date = new Date(received)
    const pass = date >= startDate && date <= endDate
    
    if (pass) {
      return {
        message: () => `expected ${date.toISOString()} not to be within range ${startDate.toISOString()} - ${endDate.toISOString()}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${date.toISOString()} to be within range ${startDate.toISOString()} - ${endDate.toISOString()}`,
        pass: false,
      }
    }
  },
})

// Helper functions for common assertions
export const assertJobStructure = (job: any) => {
  expect(job).toHaveProperty('id')
  expect(job).toHaveProperty('title')
  expect(job).toHaveProperty('company')
  expect(job).toHaveProperty('type')
  expect(job).toHaveProperty('location')
  expect(job).toHaveProperty('description')
  expect(job).toHaveProperty('url')
  
  if (job.type) {
    expect(job.type).toBeValidJobType()
  }
  
  if (job.url) {
    expect(job.url).toBeValidUrl()
  }
  
  if (job.salaryMin !== undefined && job.salaryMax !== undefined) {
    expect(job).toHaveValidSalaryRange()
  }
}

export const assertUserStructure = (user: any) => {
  expect(user).toHaveProperty('id')
  expect(user).toHaveProperty('email')
  expect(user).toHaveProperty('name')
  expect(user).toHaveProperty('role')
  
  if (user.email) {
    expect(user.email).toBeValidEmail()
  }
  
  expect(['USER', 'ADMIN', 'EMPLOYER']).toContain(user.role)
}

export const assertApiResponse = (response: any, expectSuccess = true) => {
  expect(response).toHaveProperty('success')
  expect(response.success).toBe(expectSuccess)
  
  if (expectSuccess) {
    expect(response).toHaveProperty('data')
  } else {
    expect(response).toHaveProperty('error')
  }
}

export const assertPaginatedResponse = (response: any) => {
  assertApiResponse(response, true)
  expect(response).toHaveProperty('pagination')
  expect(response.pagination).toHaveProperty('page')
  expect(response.pagination).toHaveProperty('limit')
  expect(response.pagination).toHaveProperty('total')
  expect(response.pagination).toHaveProperty('totalPages')
  expect(response.pagination).toHaveProperty('hasNext')
  expect(response.pagination).toHaveProperty('hasPrev')
} 