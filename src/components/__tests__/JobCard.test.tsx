import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobCard from '../JobCard';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  BookmarkIcon: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="bookmark-icon">
      <path d="bookmark" />
    </svg>
  ),
  StarIcon: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="star-icon">
      <path d="star" />
    </svg>
  ),
  EyeIcon: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="eye-icon">
      <path d="eye" />
    </svg>
  ),
}));

const mockJobData = {
  title: 'Senior Frontend Developer',
  company: 'Tech Corp',
  type: 'Full-time',
  postedAt: '2 days ago',
  description:
    'We are looking for a skilled frontend developer to join our team.',
  applyUrl: 'https://example.com/apply',
};

describe('JobCard', () => {
  it('renders job information correctly', () => {
    render(<JobCard {...mockJobData} />);

    expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Full-time')).toBeInTheDocument();
    expect(screen.getByText('Posted 2 days ago')).toBeInTheDocument();
    expect(
      screen.getByText(
        'We are looking for a skilled frontend developer to join our team.'
      )
    ).toBeInTheDocument();
  });

  it('renders apply link with correct attributes', () => {
    render(<JobCard {...mockJobData} />);

    const applyLink = screen.getByRole('link', {
      name: /apply for senior frontend developer at tech corp/i,
    });
    expect(applyLink).toHaveAttribute('href', 'https://example.com/apply');
    expect(applyLink).toHaveAttribute('target', '_blank');
    expect(applyLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows featured badge when isFeatured is true', () => {
    render(<JobCard {...mockJobData} isFeatured={true} />);

    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
  });

  it('does not show featured badge when isFeatured is false', () => {
    render(<JobCard {...mockJobData} isFeatured={false} />);

    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();

    render(<JobCard {...mockJobData} onClick={mockOnClick} />);

    const card = screen.getByTestId('job-card-Senior Frontend Developer');
    await user.click(card);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies selected styles when isSelected is true', () => {
    render(<JobCard {...mockJobData} isSelected={true} />);

    const card = screen.getByTestId('job-card-Senior Frontend Developer');
    expect(card).toHaveClass('border-purple-600', 'ring-2', 'ring-purple-200');
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not apply selected styles when isSelected is false', () => {
    render(<JobCard {...mockJobData} isSelected={false} />);

    const card = screen.getByTestId('job-card-Senior Frontend Developer');
    expect(card).not.toHaveClass(
      'border-purple-600',
      'ring-2',
      'ring-purple-200'
    );
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  describe('View Details functionality', () => {
    it('shows view details button when onViewDetails is provided', () => {
      const mockOnViewDetails = jest.fn();
      render(<JobCard {...mockJobData} onViewDetails={mockOnViewDetails} />);

      expect(
        screen.getByTestId('view-details-Senior Frontend Developer')
      ).toBeInTheDocument();
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('calls onViewDetails when view details button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnViewDetails = jest.fn();

      render(<JobCard {...mockJobData} onViewDetails={mockOnViewDetails} />);

      const viewDetailsButton = screen.getByTestId(
        'view-details-Senior Frontend Developer'
      );
      await user.click(viewDetailsButton);

      expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
    });

    it('prevents event propagation when view details button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();
      const mockOnViewDetails = jest.fn();

      render(
        <JobCard
          {...mockJobData}
          onClick={mockOnClick}
          onViewDetails={mockOnViewDetails}
        />
      );

      const viewDetailsButton = screen.getByTestId(
        'view-details-Senior Frontend Developer'
      );
      await user.click(viewDetailsButton);

      expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('changes apply button style when view details is available', () => {
      const mockOnViewDetails = jest.fn();
      render(<JobCard {...mockJobData} onViewDetails={mockOnViewDetails} />);

      const applyButton = screen.getByRole('link', { name: /apply for/i });
      expect(applyButton).toHaveClass(
        'bg-white',
        'text-purple-700',
        'border',
        'border-purple-200'
      );
      expect(applyButton).toHaveTextContent('Quick Apply');
    });

    it('shows primary apply button style when view details is not available', () => {
      render(<JobCard {...mockJobData} />);

      const applyButton = screen.getByRole('link', { name: /apply for/i });
      expect(applyButton).toHaveClass('bg-purple-700', 'text-white');
      expect(applyButton).toHaveTextContent('View Job');
    });
  });

  describe('Save functionality', () => {
    it('shows save button when onSave is provided', () => {
      const mockOnSave = jest.fn();
      render(<JobCard {...mockJobData} onSave={mockOnSave} />);

      expect(
        screen.getByTestId('save-Senior Frontend Developer')
      ).toBeInTheDocument();
      expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument();
    });

    it('does not show save button when onSave is not provided', () => {
      render(<JobCard {...mockJobData} />);

      expect(
        screen.queryByTestId('save-Senior Frontend Developer')
      ).not.toBeInTheDocument();
    });

    it('calls onSave when save button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();

      render(<JobCard {...mockJobData} onSave={mockOnSave} />);

      const saveButton = screen.getByTestId('save-Senior Frontend Developer');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('prevents event propagation when save button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();
      const mockOnSave = jest.fn();

      render(
        <JobCard {...mockJobData} onClick={mockOnClick} onSave={mockOnSave} />
      );

      const saveButton = screen.getByTestId('save-Senior Frontend Developer');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('shows saved state when saved is true', () => {
      const mockOnSave = jest.fn();
      render(<JobCard {...mockJobData} onSave={mockOnSave} saved={true} />);

      const saveButton = screen.getByTestId('save-Senior Frontend Developer');
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveClass(
        'bg-green-100',
        'text-green-700',
        'cursor-not-allowed'
      );
      expect(saveButton).toHaveTextContent('Saved');
    });

    it('shows unsaved state when saved is false', () => {
      const mockOnSave = jest.fn();
      render(<JobCard {...mockJobData} onSave={mockOnSave} saved={false} />);

      const saveButton = screen.getByTestId('save-Senior Frontend Developer');
      expect(saveButton).not.toBeDisabled();
      expect(saveButton).toHaveClass('bg-white', 'text-indigo-600');
      expect(saveButton).toHaveTextContent('Save');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<JobCard {...mockJobData} isSelected={true} />);

      const card = screen.getByTestId('job-card-Senior Frontend Developer');
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(card).toHaveAttribute(
        'aria-label',
        'Job listing for Senior Frontend Developer at Tech Corp'
      );
    });

    it('has proper aria-labels for buttons', () => {
      const mockOnSave = jest.fn();
      const mockOnViewDetails = jest.fn();

      render(
        <JobCard
          {...mockJobData}
          onSave={mockOnSave}
          onViewDetails={mockOnViewDetails}
        />
      );

      const viewDetailsButton = screen.getByTestId(
        'view-details-Senior Frontend Developer'
      );
      const saveButton = screen.getByTestId('save-Senior Frontend Developer');
      const applyLink = screen.getByRole('link', {
        name: /apply for senior frontend developer at tech corp/i,
      });

      expect(viewDetailsButton).toHaveAttribute(
        'aria-label',
        'View details for Senior Frontend Developer at Tech Corp'
      );
      expect(saveButton).toHaveAttribute(
        'aria-label',
        'Save Senior Frontend Developer'
      );
      expect(applyLink).toHaveAttribute(
        'aria-label',
        'Apply for Senior Frontend Developer at Tech Corp'
      );
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();

      render(<JobCard {...mockJobData} onClick={mockOnClick} />);

      const card = screen.getByTestId('job-card-Senior Frontend Developer');
      card.focus();

      expect(card).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockOnClick).toHaveBeenCalledTimes(1);

      // Test space key as well
      await user.keyboard(' ');
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Responsive behavior', () => {
    it('applies responsive classes correctly', () => {
      render(<JobCard {...mockJobData} />);

      const card = screen.getByTestId('job-card-Senior Frontend Developer');
      expect(card).toHaveClass('p-4', 'sm:p-6');

      const title = screen.getByText('Senior Frontend Developer');
      expect(title).toHaveClass('text-lg', 'sm:text-xl');
    });
  });

  describe('Edge cases', () => {
    it('handles missing optional props gracefully', () => {
      render(<JobCard {...mockJobData} />);

      // Should render without errors
      expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument();
    });

    it('handles empty description', () => {
      render(<JobCard {...mockJobData} description="" />);

      // Should not throw when description is empty
      expect(
        screen.getByTestId('job-card-Senior Frontend Developer')
      ).toBeInTheDocument();
    });

    it('handles long job titles', () => {
      const longTitle =
        'Senior Full Stack Software Engineer with React, Node.js, and Cloud Experience';
      render(<JobCard {...mockJobData} title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });
  });
});
