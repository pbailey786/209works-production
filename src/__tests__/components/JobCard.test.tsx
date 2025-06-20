/**
 * Component Tests for JobCard
 * Tests the JobCard component functionality, accessibility, and user interactions
 */

import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFactories, a11yHelpers, performanceHelpers } from '@/__tests__/utils/test-helpers';
import JobCard from '@/components/jobs/JobCard';
import { axe, toHaveNoViolations } from 'jest-axe';

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
  const mockJob = mockFactories.job({
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    location: 'Stockton, CA',
    salaryMin: 80000,
    salaryMax: 120000,
    jobType: 'Full-time',
    experienceLevel: 'Senior Level',
    skills: ['JavaScript', 'React', 'Node.js'],
    benefits: ['Health Insurance', '401k', 'Remote Work'],
    isRemote: false,
    isFeatured: true,
    isUrgent: false,
  });

  const mockProps = {
    job: mockJob,
    onSave: jest.fn(),
    onUnsave: jest.fn(),
    onApply: jest.fn(),
    isSaved: false,
    showFullDescription: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders job information correctly', () => {
      renderWithProviders(<JobCard {...mockProps} />);

      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('Stockton, CA')).toBeInTheDocument();
      expect(screen.getByText('$80,000 - $120,000')).toBeInTheDocument();
      expect(screen.getByText('Full-time')).toBeInTheDocument();
      expect(screen.getByText('Senior Level')).toBeInTheDocument();
    });

    it('displays skills and benefits', () => {
      renderWithProviders(<JobCard {...mockProps} />);

      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getByText('Health Insurance')).toBeInTheDocument();
      expect(screen.getByText('401k')).toBeInTheDocument();
    });

    it('shows featured badge for featured jobs', () => {
      renderWithProviders(<JobCard {...mockProps} />);
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('shows urgent badge for urgent jobs', () => {
      const urgentJob = { ...mockJob, isUrgent: true };
      renderWithProviders(<JobCard {...mockProps} job={urgentJob} />);
      expect(screen.getByText('Urgent')).toBeInTheDocument();
    });

    it('shows remote badge for remote jobs', () => {
      const remoteJob = { ...mockJob, isRemote: true };
      renderWithProviders(<JobCard {...mockProps} job={remoteJob} />);
      expect(screen.getByText('Remote')).toBeInTheDocument();
    });

    it('handles missing salary information', () => {
      const jobWithoutSalary = { ...mockJob, salaryMin: null, salaryMax: null };
      renderWithProviders(<JobCard {...mockProps} job={jobWithoutSalary} />);
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });

    it('truncates long descriptions when showFullDescription is false', () => {
      const longDescription = 'A'.repeat(500);
      const jobWithLongDescription = { ...mockJob, description: longDescription };
      
      renderWithProviders(
        <JobCard {...mockProps} job={jobWithLongDescription} showFullDescription={false} />
      );

      const description = screen.getByText(/A+/);
      expect(description.textContent?.length).toBeLessThan(longDescription.length);
      expect(screen.getByText('Read more')).toBeInTheDocument();
    });

    it('shows full description when showFullDescription is true', () => {
      const longDescription = 'A'.repeat(500);
      const jobWithLongDescription = { ...mockJob, description: longDescription };
      
      renderWithProviders(
        <JobCard {...mockProps} job={jobWithLongDescription} showFullDescription={true} />
      );

      const description = screen.getByText(/A+/);
      expect(description.textContent?.length).toBe(longDescription.length);
      expect(screen.queryByText('Read more')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onSave when save button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<JobCard {...mockProps} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockProps.onSave).toHaveBeenCalledWith(mockJob.id);
    });

    it('calls onUnsave when unsave button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<JobCard {...mockProps} isSaved={true} />);

      const unsaveButton = screen.getByRole('button', { name: /unsave/i });
      await user.click(unsaveButton);

      expect(mockProps.onUnsave).toHaveBeenCalledWith(mockJob.id);
    });

    it('calls onApply when apply button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<JobCard {...mockProps} />);

      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);

      expect(mockProps.onApply).toHaveBeenCalledWith(mockJob.id);
    });

    it('expands description when "Read more" is clicked', async () => {
      const user = userEvent.setup();
      const longDescription = 'A'.repeat(500);
      const jobWithLongDescription = { ...mockJob, description: longDescription };
      
      renderWithProviders(
        <JobCard {...mockProps} job={jobWithLongDescription} showFullDescription={false} />
      );

      const readMoreButton = screen.getByText('Read more');
      await user.click(readMoreButton);

      await waitFor(() => {
        const description = screen.getByText(/A+/);
        expect(description.textContent?.length).toBe(longDescription.length);
      });
    });

    it('collapses description when "Show less" is clicked', async () => {
      const user = userEvent.setup();
      const longDescription = 'A'.repeat(500);
      const jobWithLongDescription = { ...mockJob, description: longDescription };
      
      renderWithProviders(
        <JobCard {...mockProps} job={jobWithLongDescription} showFullDescription={true} />
      );

      const showLessButton = screen.getByText('Show less');
      await user.click(showLessButton);

      await waitFor(() => {
        const description = screen.getByText(/A+/);
        expect(description.textContent?.length).toBeLessThan(longDescription.length);
      });
    });

    it('navigates to job details when title is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<JobCard {...mockProps} />);

      const titleLink = screen.getByRole('link', { name: mockJob.title });
      expect(titleLink).toHaveAttribute('href', `/jobs/${mockJob.id}`);
    });

    it('shows loading state during save operation', async () => {
      const user = userEvent.setup();
      const slowOnSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProviders(<JobCard {...mockProps} onSave={slowOnSave} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

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

      const saveButton = screen.getByRole('button', { name: /save/i });
      a11yHelpers.expectAriaLabel(saveButton, 'Save job');

      const applyButton = screen.getByRole('button', { name: /apply/i });
      a11yHelpers.expectAriaLabel(applyButton, 'Apply to job');
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const titleLink = screen.getByRole('link', { name: mockJob.title });
      const saveButton = screen.getByRole('button', { name: /save/i });
      const applyButton = screen.getByRole('button', { name: /apply/i });

      // Test tab navigation
      titleLink.focus();
      expect(titleLink).toHaveFocus();

      fireEvent.keyDown(titleLink, { key: 'Tab' });
      await waitFor(() => expect(saveButton).toHaveFocus());

      fireEvent.keyDown(saveButton, { key: 'Tab' });
      await waitFor(() => expect(applyButton).toHaveFocus());
    });

    it('supports Enter key activation', async () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      saveButton.focus();

      fireEvent.keyDown(saveButton, { key: 'Enter' });
      expect(mockProps.onSave).toHaveBeenCalledWith(mockJob.id);
    });

    it('supports Space key activation', async () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const applyButton = screen.getByRole('button', { name: /apply/i });
      applyButton.focus();

      fireEvent.keyDown(applyButton, { key: ' ' });
      expect(mockProps.onApply).toHaveBeenCalledWith(mockJob.id);
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const jobTitle = screen.getByRole('heading', { level: 3 });
      expect(jobTitle).toHaveTextContent(mockJob.title);
    });

    it('provides screen reader friendly content', () => {
      renderWithProviders(<JobCard {...mockProps} />);

      const salaryInfo = screen.getByText('$80,000 - $120,000');
      expect(salaryInfo).toHaveAttribute('aria-label', 'Salary range 80,000 to 120,000 dollars');
    });
  });

  describe('Performance', () => {
    it('renders quickly with standard job data', async () => {
      const renderTime = await performanceHelpers.measureRenderTime(() => {
        renderWithProviders(<JobCard {...mockProps} />);
      });

      performanceHelpers.expectPerformance(renderTime, 50); // Should render within 50ms
    });

    it('handles large skill lists efficiently', async () => {
      const jobWithManySkills = {
        ...mockJob,
        skills: Array.from({ length: 50 }, (_, i) => `Skill ${i + 1}`),
      };

      const renderTime = await performanceHelpers.measureRenderTime(() => {
        renderWithProviders(<JobCard {...mockProps} job={jobWithManySkills} />);
      });

      performanceHelpers.expectPerformance(renderTime, 100); // Should still render within 100ms
    });

    it('memoizes expensive calculations', () => {
      const { rerender } = renderWithProviders(<JobCard {...mockProps} />);
      
      // Re-render with same props
      rerender(<JobCard {...mockProps} />);
      
      // Component should not re-render unnecessarily
      expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing job data gracefully', () => {
      const incompleteJob = {
        id: mockJob.id,
        title: mockJob.title,
        // Missing other required fields
      };

      expect(() => {
        renderWithProviders(<JobCard {...mockProps} job={incompleteJob as any} />);
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
      expect(() => user.click(saveButton)).not.toThrow();
    });

    it('displays fallback content for missing images', () => {
      const jobWithoutLogo = { ...mockJob, companyLogo: null };
      renderWithProviders(<JobCard {...mockProps} job={jobWithoutLogo} />);

      const fallbackIcon = screen.getByTestId('company-logo-fallback');
      expect(fallbackIcon).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<JobCard {...mockProps} />);

      const card = screen.getByTestId('job-card');
      expect(card).toHaveClass('mobile-layout');
    });

    it('shows desktop layout for larger screens', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      renderWithProviders(<JobCard {...mockProps} />);

      const card = screen.getByTestId('job-card');
      expect(card).toHaveClass('desktop-layout');
    });
  });

  describe('Integration with External Services', () => {
    it('tracks analytics events on interactions', async () => {
      const user = userEvent.setup();
      const mockAnalytics = jest.fn();
      
      // Mock analytics
      (global as any).gtag = mockAnalytics;

      renderWithProviders(<JobCard {...mockProps} />);

      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);

      expect(mockAnalytics).toHaveBeenCalledWith('event', 'job_apply_click', {
        job_id: mockJob.id,
        job_title: mockJob.title,
        company: mockJob.company,
      });
    });
  });
});
