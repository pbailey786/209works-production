import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/utils/test-utils';
import JobBoard from '../JobList';

// Mock the child components
jest.mock('../JobCard', () => {
  return function MockJobCard({
    title,
    company,
    onClick,
    onViewDetails,
    onSave,
    saved,
    isSelected,
  }: any) {
    return (
      <div
        data-testid={`job-card-${title}`}
        className={isSelected ? 'selected' : ''}
        onClick={onClick}
      >
        <h3>{title}</h3>
        <p>{company}</p>
        <button onClick={onViewDetails} data-testid={`view-details-${title}`}>
          View Details
        </button>
        <button onClick={onSave} data-testid={`save-${title}`}>
          {saved ? 'Unsave' : 'Save'}
        </button>
      </div>
    );
  };
});

jest.mock('../EnhancedJobModal', () => {
  return function MockEnhancedJobModal({
    isOpen,
    onClose,
    job,
    onSave,
    onApply,
    onShare,
  }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="enhanced-job-modal">
        <h2>{job?.title}</h2>
        <button onClick={onClose} data-testid="close-modal">
          Close
        </button>
        <button onClick={onSave} data-testid="modal-save">
          Save
        </button>
        <button onClick={onApply} data-testid="modal-apply">
          Apply
        </button>
        <button onClick={onShare} data-testid="modal-share">
          Share
        </button>
      </div>
    );
  };
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockJobs = [
  {
    id: 1,
    title: 'Frontend Developer',
    company: 'Tech Corp',
    type: 'Full-time',
    postedAt: '2024-01-15',
    description: 'We are looking for a skilled frontend developer...',
    applyUrl: 'https://example.com/apply/1',
    salary: '$80,000 - $100,000',
    location: 'New York, NY',
    categories: ['JavaScript', 'React'],
    isFeatured: true,
  },
  {
    id: 2,
    title: 'Backend Engineer',
    company: 'StartupXYZ',
    type: 'Contract',
    postedAt: '2024-01-14',
    description: 'Join our backend team to build scalable systems...',
    applyUrl: 'https://example.com/apply/2',
    salary: '$90,000 - $120,000',
    location: 'San Francisco, CA',
    categories: ['Node.js', 'PostgreSQL'],
  },
];

// Helper function to create a proper fetch response
const createMockResponse = (data: any, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

describe('JobBoard Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
    // Suppress act() warnings for this specific test suite since they come from
    // async useEffect operations in the component, not from test interactions
    const originalConsoleError = console.error;
    jest.spyOn(console, 'error').mockImplementation((message, ...args) => {
      if (
        typeof message === 'string' &&
        message.includes('Warning: An update to')
      ) {
        return;
      }
      if (typeof message === 'string' && message.includes('act(')) {
        return;
      }
      if (typeof message === 'string' && message.includes('wrapped in act')) {
        return;
      }
      originalConsoleError(message, ...args);
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const renderJobBoard = () => {
    return renderWithProviders(<JobBoard />);
  };

  describe('Rendering', () => {
    it('renders the search form correctly', () => {
      renderJobBoard();

      expect(
        screen.getByPlaceholderText('Job title, keyword')
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Location')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /search for jobs/i })
      ).toBeInTheDocument();
    });

    it('renders with initial empty state', () => {
      renderJobBoard();

      // Should not show loading initially
      expect(screen.queryByText('Loading jobs...')).not.toBeInTheDocument();
      // Should not show any job cards initially
      expect(screen.queryByTestId(/job-card-/)).not.toBeInTheDocument();
      // Should show placeholder text for job details
      expect(
        screen.getByText('Select a job to view details')
      ).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('handles form submission and triggers search', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ jobs: mockJobs, total: 2 })
      );

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderJobBoard();

      const jobInput = screen.getByPlaceholderText('Job title, keyword');
      const locationInput = screen.getByPlaceholderText('Location');
      const searchButton = screen.getByRole('button', {
        name: /search for jobs/i,
      });

      await user.type(jobInput, 'developer');
      await user.type(locationInput, 'New York');
      await user.click(searchButton);

      // Advance timers to trigger debounced search
      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/jobs?query=developer&location=New%20York&page=1&pageSize=20',
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
      });
    });

    it('debounces search input changes', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ jobs: mockJobs, total: 2 })
      );

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderJobBoard();

      const jobInput = screen.getByPlaceholderText('Job title, keyword');
      const searchButton = screen.getByRole('button', {
        name: /search for jobs/i,
      });

      await user.type(jobInput, 'dev');
      await user.click(searchButton);

      // Should not call fetch immediately
      expect(mockFetch).not.toHaveBeenCalled();

      // Advance timers by less than debounce time
      jest.advanceTimersByTime(300);
      expect(mockFetch).not.toHaveBeenCalled();

      // Advance timers to complete debounce
      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Job Loading and Display', () => {
    it('displays loading state during fetch', async () => {
      // Mock a delayed response
      mockFetch.mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve(createMockResponse({ jobs: mockJobs, total: 2 })),
              100
            )
          )
      );

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderJobBoard();

      const jobInput = screen.getByPlaceholderText('Job title, keyword');
      const searchButton = screen.getByRole('button', {
        name: /search for jobs/i,
      });

      await user.type(jobInput, 'developer');
      await user.click(searchButton);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByText('Loading jobs...')).toBeInTheDocument();
      });
    });

    it('displays jobs after successful fetch', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ jobs: mockJobs, total: 2 })
      );

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderJobBoard();

      const jobInput = screen.getByPlaceholderText('Job title, keyword');
      const searchButton = screen.getByRole('button', {
        name: /search for jobs/i,
      });

      await user.type(jobInput, 'developer');
      await user.click(searchButton);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(
          screen.getByTestId('job-card-Frontend Developer')
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('job-card-Backend Engineer')
        ).toBeInTheDocument();
      });
    });

    it('displays error state on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderJobBoard();

      const jobInput = screen.getByPlaceholderText('Job title, keyword');
      const searchButton = screen.getByRole('button', {
        name: /search for jobs/i,
      });

      await user.type(jobInput, 'developer');
      await user.click(searchButton);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load jobs: Network error/)
        ).toBeInTheDocument();
      });
    });

    it('displays no jobs found message when search returns empty results', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ jobs: [], total: 0 })
      );

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderJobBoard();

      const jobInput = screen.getByPlaceholderText('Job title, keyword');
      const searchButton = screen.getByRole('button', {
        name: /search for jobs/i,
      });

      await user.type(jobInput, 'nonexistent');
      await user.click(searchButton);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(
          screen.getByText('No jobs found. Try adjusting your filters.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Job Selection and Details', () => {
    // Helper function to set up jobs
    const setupJobsTest = async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ jobs: mockJobs, total: 2 })
      );

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderJobBoard();

      const jobInput = screen.getByPlaceholderText('Job title, keyword');
      const searchButton = screen.getByRole('button', {
        name: /search for jobs/i,
      });

      await act(async () => {
        await user.type(jobInput, 'developer');
        await user.click(searchButton);
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(
          screen.getByTestId('job-card-Frontend Developer')
        ).toBeInTheDocument();
      });

      return user;
    };

    it('selects job and displays details when job card is clicked', async () => {
      const user = await setupJobsTest();

      const jobCard = screen.getByTestId('job-card-Frontend Developer');

      await act(async () => {
        await user.click(jobCard);
      });

      await waitFor(() => {
        // Use more specific selectors to avoid conflicts
        const jobDetailsHeading = screen.getByRole('heading', {
          level: 2,
          name: 'Frontend Developer',
        });
        expect(jobDetailsHeading).toBeInTheDocument();

        // Find the job details container and check for company within it
        const jobDetailsContainer = jobDetailsHeading.closest('div.max-w-2xl');
        expect(jobDetailsContainer).toHaveTextContent('Tech Corp');
        expect(jobDetailsContainer).toHaveTextContent('Posted: 2024-01-15');
        expect(jobDetailsContainer).toHaveTextContent(
          'We are looking for a skilled frontend developer...'
        );
      });
    });

    it('highlights selected job card', async () => {
      const user = await setupJobsTest();

      const jobCard = screen.getByTestId('job-card-Frontend Developer');

      await act(async () => {
        await user.click(jobCard);
      });

      await waitFor(() => {
        expect(jobCard).toHaveClass('selected');
      });
    });

    it('displays View Full Details and Apply Now buttons for selected job', async () => {
      const user = await setupJobsTest();

      const jobCard = screen.getByTestId('job-card-Frontend Developer');

      await act(async () => {
        await user.click(jobCard);
      });

      await waitFor(() => {
        expect(screen.getByText('View Full Details')).toBeInTheDocument();
        expect(screen.getByText('Apply Now')).toBeInTheDocument();
      });
    });
  });

  describe('Enhanced Job Modal', () => {
    // Helper function to set up jobs
    const setupJobsTest = async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ jobs: mockJobs, total: 2 })
      );

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderJobBoard();

      const jobInput = screen.getByPlaceholderText('Job title, keyword');
      const searchButton = screen.getByRole('button', {
        name: /search for jobs/i,
      });

      await act(async () => {
        await user.type(jobInput, 'developer');
        await user.click(searchButton);
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(
          screen.getByTestId('job-card-Frontend Developer')
        ).toBeInTheDocument();
      });

      return user;
    };

    it('opens modal when View Details button is clicked', async () => {
      const user = await setupJobsTest();

      const viewDetailsButton = screen.getByTestId(
        'view-details-Frontend Developer'
      );

      await act(async () => {
        await user.click(viewDetailsButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-job-modal')).toBeInTheDocument();
        // Use a more specific selector within the modal
        const modal = screen.getByTestId('enhanced-job-modal');
        expect(modal).toHaveTextContent('Frontend Developer');
      });
    });

    it('closes modal when close button is clicked', async () => {
      const user = await setupJobsTest();

      const viewDetailsButton = screen.getByTestId(
        'view-details-Frontend Developer'
      );

      await act(async () => {
        await user.click(viewDetailsButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-job-modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('close-modal');

      await act(async () => {
        await user.click(closeButton);
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('enhanced-job-modal')
        ).not.toBeInTheDocument();
      });
    });

    it('opens modal when View Full Details button is clicked from job details', async () => {
      const user = await setupJobsTest();

      // First select a job
      const jobCard = screen.getByTestId('job-card-Frontend Developer');

      await act(async () => {
        await user.click(jobCard);
      });

      // Wait for job details to appear
      await waitFor(() => {
        expect(screen.getByText('View Full Details')).toBeInTheDocument();
      });

      // Then click View Full Details
      const viewFullDetailsButton = screen.getByText('View Full Details');

      await act(async () => {
        await user.click(viewFullDetailsButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-job-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Job Saving Functionality', () => {
    // Helper function to set up jobs
    const setupJobsTest = async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ jobs: mockJobs, total: 2 })
      );

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderJobBoard();

      const jobInput = screen.getByPlaceholderText('Job title, keyword');
      const searchButton = screen.getByRole('button', {
        name: /search for jobs/i,
      });

      await act(async () => {
        await user.type(jobInput, 'developer');
        await user.click(searchButton);
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(
          screen.getByTestId('job-card-Frontend Developer')
        ).toBeInTheDocument();
      });

      return user;
    };

    it('toggles job save state when save button is clicked', async () => {
      const user = await setupJobsTest();

      const saveButton = screen.getByTestId('save-Frontend Developer');
      expect(saveButton).toHaveTextContent('Save');

      await act(async () => {
        await user.click(saveButton);
      });

      await waitFor(() => {
        expect(saveButton).toHaveTextContent('Unsave');
      });

      await act(async () => {
        await user.click(saveButton);
      });

      await waitFor(() => {
        expect(saveButton).toHaveTextContent('Save');
      });
    });

    it('saves job from modal', async () => {
      const user = await setupJobsTest();

      // Open modal
      const viewDetailsButton = screen.getByTestId(
        'view-details-Frontend Developer'
      );

      await act(async () => {
        await user.click(viewDetailsButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-job-modal')).toBeInTheDocument();
      });

      // Save from modal
      const modalSaveButton = screen.getByTestId('modal-save');

      await act(async () => {
        await user.click(modalSaveButton);
      });

      // Check that job card shows as saved
      await waitFor(() => {
        const saveButton = screen.getByTestId('save-Frontend Developer');
        expect(saveButton).toHaveTextContent('Unsave');
      });
    });
  });

  describe('Pagination', () => {
    it('displays pagination controls when there are multiple pages', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ jobs: mockJobs, total: 50 })
      ); // More than 20 jobs

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderJobBoard();

      const jobInput = screen.getByPlaceholderText('Job title, keyword');
      const searchButton = screen.getByRole('button', {
        name: /search for jobs/i,
      });

      await user.type(jobInput, 'developer');
      await user.click(searchButton);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });
    });

    it('handles next page navigation', async () => {
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({ jobs: mockJobs, total: 50 })
        )
        .mockResolvedValueOnce(
          createMockResponse({ jobs: [mockJobs[0]], total: 50 })
        );

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderJobBoard();

      const jobInput = screen.getByPlaceholderText('Job title, keyword');
      const searchButton = screen.getByRole('button', {
        name: /search for jobs/i,
      });

      await user.type(jobInput, 'developer');
      await user.click(searchButton);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/jobs?query=developer&location=&page=2&pageSize=20',
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
      });
    });

    it('disables Previous button on first page', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ jobs: mockJobs, total: 50 })
      );

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderJobBoard();

      const jobInput = screen.getByPlaceholderText('Job title, keyword');
      const searchButton = screen.getByRole('button', {
        name: /search for jobs/i,
      });

      await user.type(jobInput, 'developer');
      await user.click(searchButton);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        const previousButton = screen.getByText('Previous');
        expect(previousButton).toBeDisabled();
      });
    });
  });

  describe('Request Abortion', () => {
    it('aborts previous request when new search is initiated', async () => {
      const abortSpy = jest.fn();
      const mockAbortController = {
        abort: abortSpy,
        signal: { aborted: false },
      };
      jest
        .spyOn(window, 'AbortController')
        .mockImplementation(() => mockAbortController as any);

      mockFetch.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve(createMockResponse({ jobs: mockJobs, total: 2 })),
              1000
            )
          )
      );

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderJobBoard();

      const jobInput = screen.getByPlaceholderText('Job title, keyword');
      const searchButton = screen.getByRole('button', {
        name: /search for jobs/i,
      });

      // First search
      await user.type(jobInput, 'developer');
      await user.click(searchButton);
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Second search before first completes
      await user.clear(jobInput);
      await user.type(jobInput, 'engineer');
      await user.click(searchButton);
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria labels for form inputs', () => {
      renderJobBoard();

      const jobInput = screen.getByLabelText('Job title or keyword');
      const locationInput = screen.getByLabelText('Location');
      const searchButton = screen.getByLabelText('Search for jobs');

      expect(jobInput).toBeInTheDocument();
      expect(locationInput).toBeInTheDocument();
      expect(searchButton).toBeInTheDocument();
    });

    it('has proper screen reader labels', () => {
      renderJobBoard();

      expect(
        screen.getByText('Job title or keyword', { selector: '.sr-only' })
      ).toBeInTheDocument();
      expect(
        screen.getByText('Location', { selector: '.sr-only' })
      ).toBeInTheDocument();
    });
  });
});
