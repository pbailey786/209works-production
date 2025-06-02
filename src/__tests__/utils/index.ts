// Export all test utilities from a single entry point
export * from './test-utils'
export * from './mock-data'
export * from './api-mocks'
export * from './custom-matchers'

// Re-export commonly used testing library functions
export {
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
  within,
  getByRole,
  getByText,
  getByLabelText,
  getByTestId,
  queryByRole,
  queryByText,
  queryByLabelText,
  queryByTestId,
  findByRole,
  findByText,
  findByLabelText,
  findByTestId,
} from '@testing-library/react'

export { userEvent } from '@testing-library/user-event' 