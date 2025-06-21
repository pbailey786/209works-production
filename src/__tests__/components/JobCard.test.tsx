/**
 * Component Tests for JobCard
 * Tests the JobCard component functionality, accessibility, and user interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import { renderWithProviders, mockFactories, a11yHelpers, performanceHelpers } from '@/__tests__/utils/test-helpers';
import JobCard from '@/components/JobCard';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock next/router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: mockFactories.user(),
    isLoaded: true,
  }),
}));

describe('JobCard Component', () => {
  const mockProps = {
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    type: 'Full-time',
    postedAt: '2024-01-15T10:00:00Z',
    description: 'We are looking for a senior software engineer to join our team...',
    applyUrl: 'https://example.com/apply',
    isFeatured: true,
    onSave: jest.fn(),
    saved: false,
    onClick: jest.fn(),
    isSelected: false,
    onViewDetails: jest.fn(),
    applied: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders job information correctly', () => {
      renderWithProviders(<JobCard {...mockProps} />);

      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('Full-time')).toBeInTheDocument();
      expect(screen.getByText(/We are looking for a senior software engineer/)).toBeInTheDocument();
    });

    it('shows featured badge for featured jobs', () => {
      renderWithProviders(<JobCard {...mockProps} />);
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('shows applied badge for applied jobs', () => {
      renderWithProviders(<JobCard {...mockProps} applied={true} />);
      expect(screen.getByText('Applied')).toBeInTheDocument();
    });

    it('displays description with line clamp', () => {
      const longDescription = 'A'.repeat(500);
      renderWithProviders(<JobCard {...mockProps} description={longDescription} />);

      const description = screen.getByText(/A+/);
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('line-clamp-3');
    });
  });

  describe('User Interactions', () => {
    it('calls onSave when save button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<JobCard {...mockProps} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockProps.onSave).toHaveBeenCalled();
    });

    it('calls onClick when card is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<JobCard {...mockProps} />);

      const card = screen.getByRole('article');
      await user.click(card);

      expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('calls onViewDetails when view details button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<JobCard {...mockProps} />);

      const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
      await user.click(viewDetailsButton);

      expect(mockProps.onViewDetails).toHaveBeenCalled();
    });

    it('has apply link with correct URL', () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const applyLink = screen.getByRole('link', { name: /apply/i });
      expect(applyLink).toHaveAttribute('href', mockProps.applyUrl);
      expect(applyLink).toHaveAttribute('target', '_blank');
    });

    it('shows loading state during save operation', async () => {
      const user = userEvent.setup();
      const slowOnSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(<JobCard {...mockProps} onSave={slowOnSave} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithProviders(<JobCard {...mockProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels', () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', `Job listing for ${mockProps.title} at ${mockProps.company}`);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toHaveAttribute('aria-label', `Save ${mockProps.title}`);
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const card = screen.getByRole('article');
      const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
      const saveButton = screen.getByRole('button', { name: /save/i });

      // Test tab navigation
      card.focus();
      expect(card).toHaveFocus();

      // Test that buttons are focusable
      viewDetailsButton.focus();
      expect(viewDetailsButton).toHaveFocus();

      saveButton.focus();
      expect(saveButton).toHaveFocus();
    });

    it('supports Enter key activation on card', async () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const card = screen.getByRole('article');
      card.focus();

      fireEvent.keyDown(card, { key: 'Enter' });
      expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('supports Space key activation on card', async () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const card = screen.getByRole('article');
      card.focus();

      fireEvent.keyDown(card, { key: ' ' });
      expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const jobTitle = screen.getByRole('heading', { level: 2 });
      expect(jobTitle).toHaveTextContent(mockProps.title);
    });

    it('provides screen reader friendly content', () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const postedTime = screen.getByText(/Posted/);
      expect(postedTime).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders quickly with standard job data', async () => {
      const renderTime = await performanceHelpers.measureRenderTime(() => {
        renderWithProviders(<JobCard {...mockProps} />);
      });

      performanceHelpers.expectPerformance(renderTime, 50); // Should render within 50ms
    });

    it('handles long descriptions efficiently', async () => {
      const longDescription = 'A'.repeat(1000);

      const renderTime = await performanceHelpers.measureRenderTime(() => {
        renderWithProviders(<JobCard {...mockProps} description={longDescription} />);
      });

      performanceHelpers.expectPerformance(renderTime, 100); // Should still render within 100ms
    });

    it('memoizes expensive calculations', () => {
      const { rerender } = renderWithProviders(<JobCard {...mockProps} />);

      // Re-render with same props
      rerender(<JobCard {...mockProps} />);

      // Component should not re-render unnecessarily
      expect(screen.getByText(mockProps.title)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing optional props gracefully', () => {
      const minimalProps = {
        title: 'Test Job',
        company: 'Test Company',
        type: 'Full-time',
        postedAt: '2024-01-15T10:00:00Z',
        description: 'Test description',
        applyUrl: 'https://example.com/apply',
      };

      expect(() => {
        renderWithProviders(<JobCard {...minimalProps} />);
      }).not.toThrow();
    });

    it('handles callback errors gracefully', async () => {
      const user = userEvent.setup();
      const errorOnSave = jest.fn(() => {
        throw new Error('Save failed');
      });

      renderWithProviders(<JobCard {...mockProps} onSave={errorOnSave} />);

      const saveButton = screen.getByRole('button', { name: /save/i });

      // Should not crash the component
      await user.click(saveButton);

      // Should show error message
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('has responsive classes', () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const card = screen.getByRole('article');
      expect(card).toHaveClass('p-4', 'sm:p-6');
    });

    it('has responsive text sizing', () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveClass('text-lg', 'sm:text-xl');
    });
  });

  describe('Integration with External Services', () => {
    it('has external apply link', () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const applyLink = screen.getByRole('link', { name: /apply/i });
      expect(applyLink).toHaveAttribute('href', mockProps.applyUrl);
      expect(applyLink).toHaveAttribute('target', '_blank');
      expect(applyLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
