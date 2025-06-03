import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShouldIApplyCalculator from '../ShouldIApplyCalculator';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockProps = {
  isOpen: true,
  onClose: jest.fn(),
  jobId: 'test-job-id',
  jobTitle: 'Software Engineer',
  company: 'Test Company',
  isAuthenticated: true,
  userId: 'test-user-id',
};

describe('ShouldIApplyCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<ShouldIApplyCalculator {...mockProps} />);

    expect(screen.getByText('Should I Apply?')).toBeInTheDocument();
    expect(
      screen.getByText('AI analysis for Software Engineer at Test Company')
    ).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ShouldIApplyCalculator {...mockProps} isOpen={false} />);

    expect(screen.queryByText('Should I Apply?')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ShouldIApplyCalculator {...mockProps} />);

    const closeButton = screen.getByLabelText('Close calculator');
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });
});
