import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedJobModal from '../EnhancedJobModal';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

const mockJob = {
  id: 1,
  title: 'Senior Software Engineer',
  company: 'TechCorp Solutions',
  type: 'Full-time',
  location: 'San Francisco, CA',
  postedAt: '2024-01-15',
  description:
    'We are looking for a talented Senior Software Engineer to join our dynamic team.',
  url: 'https://example.com/apply/1',
  salaryMin: 120000,
  salaryMax: 180000,
  categories: ['Technology', 'Engineering'],
};

describe('EnhancedJobModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    job: mockJob,
    onSave: jest.fn(),
    onApply: jest.fn(),
    onShare: jest.fn(),
    saved: false,
    isAuthenticated: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal when open', () => {
    render(<EnhancedJobModal {...defaultProps} />);

    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('TechCorp Solutions')).toBeInTheDocument();
    expect(screen.getAllByText('San Francisco, CA')).toHaveLength(2);
  });

  it('does not render when closed', () => {
    render(<EnhancedJobModal {...defaultProps} isOpen={false} />);

    expect(
      screen.queryByText('Senior Software Engineer')
    ).not.toBeInTheDocument();
  });

  it('displays all tab navigation options', () => {
    render(<EnhancedJobModal {...defaultProps} />);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getAllByText('Job Details')).toHaveLength(2);
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Apply')).toBeInTheDocument();
  });

  it('switches tabs when clicked', async () => {
    render(<EnhancedJobModal {...defaultProps} />);

    // Click on Job Details tab using a more specific selector
    fireEvent.click(screen.getAllByText('Job Details')[0]);

    await waitFor(() => {
      expect(screen.getByText('Key Responsibilities')).toBeInTheDocument();
      expect(screen.getByText('Requirements')).toBeInTheDocument();
      expect(screen.getByText('Benefits & Perks')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(<EnhancedJobModal {...defaultProps} />);

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSave when save button is clicked', () => {
    render(<EnhancedJobModal {...defaultProps} />);

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('shows saved state when job is saved', () => {
    render(<EnhancedJobModal {...defaultProps} saved={true} />);

    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('displays salary information correctly', () => {
    render(<EnhancedJobModal {...defaultProps} />);

    expect(screen.getByText('$120,000 - $180,000')).toBeInTheDocument();
  });

  it('displays enhanced job details in Company tab', async () => {
    render(<EnhancedJobModal {...defaultProps} />);

    // Click on Company tab
    fireEvent.click(screen.getByText('Company'));

    await waitFor(() => {
      expect(screen.getByText('What Employees Say')).toBeInTheDocument();
      expect(screen.getByText('Company Values')).toBeInTheDocument();
    });
  });

  it('displays apply tab with application tips', async () => {
    render(<EnhancedJobModal {...defaultProps} />);

    // Click on Apply tab
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(screen.getByText('Ready to Apply?')).toBeInTheDocument();
      expect(screen.getByText('Tips for Your Application')).toBeInTheDocument();
      expect(screen.getByText('Apply Now')).toBeInTheDocument();
    });
  });

  it('closes modal when escape key is pressed', () => {
    render(<EnhancedJobModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows authentication prompt when not authenticated and trying to save', () => {
    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<EnhancedJobModal {...defaultProps} isAuthenticated={false} />);

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(alertSpy).toHaveBeenCalledWith('Please sign in to save jobs');

    alertSpy.mockRestore();
  });
});
