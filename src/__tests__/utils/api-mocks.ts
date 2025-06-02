import { jest } from '@jest/globals'
import { mockApiResponse, mockPaginatedResponse, createMockJobs, createMockJob } from './mock-data'

// Type for fetch mock
type FetchMock = jest.MockedFunction<typeof fetch>

// Mock fetch globally
export const mockFetch = jest.fn<typeof fetch>()
global.fetch = mockFetch as any

// Helper to setup fetch mock responses
export const setupFetchMock = (responses: Array<{ url: string | RegExp; response: any; status?: number }>) => {
  mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString()
    const matchedResponse = responses.find(r => 
      typeof r.url === 'string' ? url.includes(r.url) : r.url.test(url)
    )
    
    if (!matchedResponse) {
      throw new Error(`No mock response found for ${url}`)
    }
    
    return {
      ok: (matchedResponse.status || 200) < 400,
      status: matchedResponse.status || 200,
      json: async () => matchedResponse.response,
      text: async () => JSON.stringify(matchedResponse.response),
    } as Response
  })
}

// Common API mock responses
export const apiMocks = {
  // Job search API
  jobSearch: {
    success: mockApiResponse(createMockJobs(5)),
    empty: mockApiResponse([]),
    error: mockApiResponse(null, false),
    paginated: mockPaginatedResponse(createMockJobs(10), 1, 5, 20),
  },
  
  // Job details API
  jobDetails: {
    success: mockApiResponse(createMockJob()),
    notFound: { success: false, error: 'Job not found', status: 404 },
  },
  
  // User authentication API
  auth: {
    loginSuccess: mockApiResponse({ 
      user: { id: '1', email: 'user@example.com', name: 'Test User' },
      token: 'mock-jwt-token'
    }),
    loginError: mockApiResponse(null, false),
    registerSuccess: mockApiResponse({ message: 'User created successfully' }),
    registerError: mockApiResponse(null, false),
  },
  
  // Job alerts API
  jobAlerts: {
    list: mockApiResponse([
      { id: '1', title: 'React Developer Alert', isActive: true },
      { id: '2', title: 'Node.js Developer Alert', isActive: false },
    ]),
    create: mockApiResponse({ id: '3', title: 'New Alert', isActive: true }),
    update: mockApiResponse({ id: '1', title: 'Updated Alert', isActive: true }),
    delete: mockApiResponse({ message: 'Alert deleted successfully' }),
  },
}

// Helper to mock specific API endpoints
export const mockApiEndpoint = (endpoint: string, response: any, status = 200) => {
  setupFetchMock([{ url: endpoint, response, status }])
}

// Helper to mock multiple endpoints
export const mockApiEndpoints = (endpoints: Record<string, { response: any; status?: number }>) => {
  const responses = Object.entries(endpoints).map(([url, config]) => ({
    url,
    response: config.response,
    status: config.status || 200,
  }))
  setupFetchMock(responses)
}

// Helper to simulate network errors
export const mockNetworkError = (endpoint?: string) => {
  if (endpoint) {
    mockFetch.mockImplementation(async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes(endpoint)) {
        throw new Error('Network error')
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response
    })
  } else {
    mockFetch.mockRejectedValue(new Error('Network error'))
  }
}

// Helper to simulate slow responses
export const mockSlowResponse = (endpoint: string, delay = 1000, response: any = {}) => {
  mockFetch.mockImplementation(async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url.includes(endpoint)) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            status: 200,
            json: async () => response,
          } as Response)
        }, delay)
      })
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response
  })
}

// Reset all mocks
export const resetApiMocks = () => {
  mockFetch.mockReset()
}

// Helper for testing API calls
export const expectApiCall = (url: string, options?: Partial<RequestInit>) => {
  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining(url),
    expect.objectContaining(options || {})
  )
}

// Helper for testing API call count
export const expectApiCallCount = (count: number) => {
  expect(mockFetch).toHaveBeenCalledTimes(count)
} 