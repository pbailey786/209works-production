import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardCard from '../DashboardCard';

describe('DashboardCard', () => {
  const defaultProps = {
    title: 'Test Dashboard Card',
    description: 'This is a test dashboard card description',
  };

  describe('Rendering', () => {
    it('renders title and description correctly', () => {
      render(<DashboardCard {...defaultProps} />);

      expect(screen.getByText('Test Dashboard Card')).toBeInTheDocument();
      expect(screen.getByText('This is a test dashboard card description')).toBeInTheDocument();
    });

    it('renders children when provided', () => {
      render(
        <DashboardCard {...defaultProps}>
          <div>Test child content</div>
        </DashboardCard>
      );

      expect(screen.getByText('Test child content')).toBeInTheDocument();
    });

    it('renders Open button with correct label', () => {
      render(<DashboardCard {...defaultProps} />);

      const button = screen.getByRole('button', { name: 'Open Test Dashboard Card widget' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Open');
    });

    it('applies correct CSS classes', () => {
      render(<DashboardCard {...defaultProps} />);

      const card = screen.getByRole('region');
      expect(card).toHaveClass(
        'bg-white',
        'p-4',
        'rounded-2xl',
        'shadow-md',
        'hover:shadow-lg',
        'transition',
        'flex',
        'flex-col',
        'h-full'
      );
    });
  });

  describe('Loading State', () => {
    it('shows skeleton when isLoading is true', () => {
      render(<DashboardCard {...defaultProps} isLoading={true} />);

      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('shows skeleton animation classes', () => {
      render(<DashboardCard {...defaultProps} isLoading={true} />);

      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toHaveClass('animate-pulse', 'space-y-2');

      const skeletonBars = document.querySelectorAll('.bg-gray-200');
      expect(skeletonBars).toHaveLength(3);
    });

    it('does not show children when loading', () => {
      render(
        <DashboardCard {...defaultProps} isLoading={true}>
          <div>Should not be visible</div>
        </DashboardCard>
      );

      expect(screen.queryByText('Should not be visible')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty message when empty is true', () => {
      render(<DashboardCard {...defaultProps} empty={true} />);

      expect(screen.getByText('No items yet.')).toBeInTheDocument();
    });

    it('applies correct styling to empty message', () => {
      render(<DashboardCard {...defaultProps} empty={true} />);

      const emptyMessage = screen.getByText('No items yet.');
      expect(emptyMessage).toHaveClass('text-gray-400');
    });

    it('does not show children when empty', () => {
      render(
        <DashboardCard {...defaultProps} empty={true}>
          <div>Should not be visible</div>
        </DashboardCard>
      );

      expect(screen.queryByText('Should not be visible')).not.toBeInTheDocument();
    });

    it('prioritizes loading over empty state', () => {
      render(<DashboardCard {...defaultProps} isLoading={true} empty={true} />);

      expect(screen.queryByText('No items yet.')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('renders children when not loading and not empty', () => {
      render(
        <DashboardCard {...defaultProps}>
          <div>Normal content</div>
        </DashboardCard>
      );

      expect(screen.getByText('Normal content')).toBeInTheDocument();
    });

    it('handles complex children elements', () => {
      render(
        <DashboardCard {...defaultProps}>
          <div>
            <h3>Nested Title</h3>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </DashboardCard>
      );

      expect(screen.getByText('Nested Title')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('renders without children when none provided', () => {
      render(<DashboardCard {...defaultProps} />);

      // Should not show empty state unless explicitly set
      expect(screen.queryByText('No items yet.')).not.toBeInTheDocument();
      
      // Content area should be empty but present
      const contentArea = screen.getByRole('region').querySelector('.mb-4.flex-1');
      expect(contentArea).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('handles button click events', async () => {
      const user = userEvent.setup();
      render(<DashboardCard {...defaultProps} />);

      const button = screen.getByRole('button', { name: 'Open Test Dashboard Card widget' });
      
      // Button should be clickable
      expect(button).toBeEnabled();
      
      await user.click(button);
      
      // Since no onClick handler is provided in the component,
      // we just verify the button is interactive
      expect(button).toHaveFocus();
    });

    it('applies correct button styling', () => {
      render(<DashboardCard {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'mt-auto',
        'bg-blue-600',
        'text-white',
        'py-1',
        'px-3',
        'rounded',
        'hover:bg-blue-700',
        'text-sm',
        'focus:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-blue-400'
      );
    });

    it('has proper focus management', async () => {
      const user = userEvent.setup();
      render(<DashboardCard {...defaultProps} />);

      const button = screen.getByRole('button');
      
      await user.tab();
      expect(button).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<DashboardCard {...defaultProps} />);

      const card = screen.getByRole('region');
      expect(card).toHaveAttribute('aria-labelledby');
      
      const headingId = card.getAttribute('aria-labelledby');
      const heading = document.getElementById(headingId!);
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Test Dashboard Card');
    });

    it('generates unique heading IDs for different titles', () => {
      const { rerender } = render(<DashboardCard title="First Card" description="First" />);
      const firstHeading = screen.getByRole('heading', { name: 'First Card' });
      const firstId = firstHeading.getAttribute('id');

      rerender(<DashboardCard title="Second Card" description="Second" />);
      const secondHeading = screen.getByRole('heading', { name: 'Second Card' });
      const secondId = secondHeading.getAttribute('id');

      expect(firstId).not.toBe(secondId);
      expect(firstId).toBe('first-card-heading');
      expect(secondId).toBe('second-card-heading');
    });

    it('handles titles with spaces and special characters', () => {
      render(<DashboardCard title="My Special Card Title!" description="Test" />);

      const heading = screen.getByRole('heading');
      expect(heading).toHaveAttribute('id', 'my-special-card-title!-heading');
    });

    it('has proper heading hierarchy', () => {
      render(<DashboardCard {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Test Dashboard Card');
    });

    it('button has accessible label', () => {
      render(<DashboardCard title="Analytics Dashboard" description="View analytics" />);

      const button = screen.getByRole('button', { name: 'Open Analytics Dashboard widget' });
      expect(button).toHaveAttribute('aria-label', 'Open Analytics Dashboard widget');
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct text styling to title', () => {
      render(<DashboardCard {...defaultProps} />);

      const title = screen.getByRole('heading');
      expect(title).toHaveClass('text-xl', 'font-semibold', 'mb-2');
    });

    it('applies correct text styling to description', () => {
      render(<DashboardCard {...defaultProps} />);

      const description = screen.getByText(defaultProps.description);
      expect(description).toHaveClass('text-sm', 'text-gray-600', 'mb-4');
    });

    it('applies flexbox layout for proper content distribution', () => {
      render(<DashboardCard {...defaultProps} />);

      const card = screen.getByRole('region');
      expect(card).toHaveClass('flex', 'flex-col', 'h-full');

      const contentArea = card.querySelector('.flex-1');
      expect(contentArea).toBeInTheDocument();

      const button = screen.getByRole('button');
      expect(button).toHaveClass('mt-auto');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title gracefully', () => {
      render(<DashboardCard title="" description="No title card" />);

      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent('');
      expect(heading).toHaveAttribute('id', '-heading');
    });

    it('handles empty description gracefully', () => {
      render(<DashboardCard title="Title Only" description="" />);

      const description = screen.getByText('', { selector: 'p' });
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm', 'text-gray-600', 'mb-4');
    });

    it('handles very long titles', () => {
      const longTitle = 'This is a very long title that might cause layout issues if not handled properly';
      render(<DashboardCard title={longTitle} description="Test" />);

      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent(longTitle);
      
      const button = screen.getByRole('button', { 
        name: `Open ${longTitle} widget` 
      });
      expect(button).toBeInTheDocument();
    });

    it('maintains layout integrity with varying content sizes', () => {
      const shortContent = <div>Short</div>;
      const longContent = (
        <div>
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i}>This is line {i + 1} of long content</p>
          ))}
        </div>
      );

      const { rerender } = render(
        <DashboardCard {...defaultProps}>{shortContent}</DashboardCard>
      );

      let card = screen.getByRole('region');
      expect(card).toHaveClass('h-full');

      rerender(<DashboardCard {...defaultProps}>{longContent}</DashboardCard>);

      card = screen.getByRole('region');
      expect(card).toHaveClass('h-full');
      
      // Button should still be at the bottom
      const button = screen.getByRole('button');
      expect(button).toHaveClass('mt-auto');
    });
  });
}); 