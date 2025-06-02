import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession, signIn, signOut } from 'next-auth/react';
import Header from '../Header';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock('next/image', () => {
  return ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  );
});

// Mock Avatar component
jest.mock('../Avatar', () => {
  return ({ src, alt, size }: any) => (
    <div data-testid="avatar" data-src={src || ''} data-alt={alt} data-size={size}>
      Avatar
    </div>
  );
});

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading spinner when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      });

      render(<Header />);
      
      const loadingSpinner = document.querySelector('.animate-pulse.w-8.h-8.bg-gray-200.rounded-full');
      expect(loadingSpinner).toBeInTheDocument();
      expect(loadingSpinner).toHaveClass('animate-pulse', 'w-8', 'h-8', 'bg-gray-200', 'rounded-full');
    });
  });

  describe('Unauthenticated state', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
    });

    it('renders logo and navigation correctly', () => {
      render(<Header />);
      
      expect(screen.getByAltText('209Jobs Logo')).toBeInTheDocument();
      expect(screen.getByText('209Jobs')).toBeInTheDocument();
      
      // Check navigation items
      expect(screen.getByText('Find Jobs')).toBeInTheDocument();
      expect(screen.getByText('AI Tools')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('shows sign in and sign up buttons', () => {
      render(<Header />);
      
      expect(screen.getByRole('link', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sign Up' })).toBeInTheDocument();
    });

    it('has correct navigation links', () => {
      render(<Header />);
      
      expect(screen.getByRole('link', { name: 'Find Jobs' })).toHaveAttribute('href', '/jobs');
      expect(screen.getByRole('link', { name: 'AI Tools' })).toHaveAttribute('href', '/tools');
      expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/services');
      expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
      expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
    });

    it('has correct auth links', () => {
      render(<Header />);
      
      expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/signin');
      expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/signup');
    });
  });

  describe('Authenticated state', () => {
    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      image: 'https://example.com/avatar.jpg',
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: mockUser, expires: '2024-01-01' },
        status: 'authenticated',
        update: jest.fn(),
      });
    });

    it('shows user avatar and name', () => {
      render(<Header />);
      
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('shows user dropdown menu on hover', async () => {
      render(<Header />);
      
      const userButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.mouseEnter(userButton.parentElement!);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Applications')).toBeInTheDocument();
        expect(screen.getByText('Saved Jobs')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });
    });

    it('has correct user navigation links', async () => {
      render(<Header />);
      
      const userButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.mouseEnter(userButton.parentElement!);
      
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
        expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
        expect(screen.getByRole('link', { name: 'Applications' })).toHaveAttribute('href', '/profile/applications');
        expect(screen.getByRole('link', { name: 'Saved Jobs' })).toHaveAttribute('href', '/profile/saved');
        expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/profile/settings');
      });
    });

    it('calls signOut when sign out button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const userButton = screen.getByRole('button', { name: /john doe/i });
      fireEvent.mouseEnter(userButton.parentElement!);
      
      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });
      
      const signOutButton = screen.getByRole('button', { name: 'Sign Out' });
      await user.click(signOutButton);
      
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('shows email when name is not available', () => {
      mockUseSession.mockReturnValue({
        data: { 
          user: { ...mockUser, name: undefined }, 
          expires: '2024-01-01' 
        },
        status: 'authenticated',
        update: jest.fn(),
      });

      render(<Header />);
      
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('passes correct props to Avatar component', () => {
      render(<Header />);
      
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('data-src', 'https://example.com/avatar.jpg');
      expect(avatar).toHaveAttribute('data-alt', 'John Doe');
      expect(avatar).toHaveAttribute('data-size', '32');
    });
  });

  describe('Mobile menu', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
    });

    it('shows mobile menu button', () => {
      render(<Header />);
      
      const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('toggles mobile menu when button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
      
      // Menu should not be visible initially
      expect(screen.queryByText('Find Jobs')).toBeInTheDocument(); // Desktop nav
      
      // Click to open mobile menu
      await user.click(mobileMenuButton);
      
      // Mobile menu should be visible (there will be duplicate nav items)
      const findJobsLinks = screen.getAllByText('Find Jobs');
      expect(findJobsLinks).toHaveLength(2); // One in desktop nav, one in mobile nav
    });

    it('closes mobile menu when navigation link is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
      
      // Open mobile menu
      await user.click(mobileMenuButton);
      
      // Click a navigation link in mobile menu
      const mobileNavLinks = screen.getAllByText('Find Jobs');
      await user.click(mobileNavLinks[1]); // Click the mobile nav link
      
      // Menu should close (only desktop nav visible)
      await waitFor(() => {
        const findJobsLinks = screen.getAllByText('Find Jobs');
        expect(findJobsLinks).toHaveLength(1);
      });
    });

    it('shows user navigation in mobile menu when authenticated', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        image: 'https://example.com/avatar.jpg',
      };

      mockUseSession.mockReturnValue({
        data: { user: mockUser, expires: '2024-01-01' },
        status: 'authenticated',
        update: jest.fn(),
      });

      render(<Header />);
      
      const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
      await user.click(mobileMenuButton);
      
      // Should show user navigation in mobile menu
      const dashboardLinks = screen.getAllByText('Dashboard');
      expect(dashboardLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
    });

    it('has proper ARIA labels', () => {
      render(<Header />);
      
      expect(screen.getByRole('button', { name: 'Toggle mobile menu' })).toBeInTheDocument();
    });

    it('has proper focus management', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
      
      // Focus the mobile menu button directly to test focus management
      mobileMenuButton.focus();
      expect(mobileMenuButton).toHaveFocus();
    });

    it('has proper keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
      mobileMenuButton.focus();
      
      await user.keyboard('{Enter}');
      
      // Mobile menu should open
      const findJobsLinks = screen.getAllByText('Find Jobs');
      expect(findJobsLinks).toHaveLength(2);
    });
  });

  describe('Responsive behavior', () => {
    it('applies correct responsive classes', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<Header />);
      
      // Check that mobile menu button has md:hidden class
      const mobileMenuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
      expect(mobileMenuButton).toHaveClass('md:hidden');
      
      // Check that desktop nav has hidden md:flex classes
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('hidden', 'md:flex');
    });
  });

  describe('Edge cases', () => {
    it('handles missing user image gracefully', () => {
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        image: null,
      };

      mockUseSession.mockReturnValue({
        data: { user: mockUser, expires: '2024-01-01' },
        status: 'authenticated',
        update: jest.fn(),
      });

      render(<Header />);
      
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('data-src', '');
    });

    it('handles missing user name and email gracefully', () => {
      const mockUser = {
        id: '1',
        name: null,
        email: null,
        image: 'https://example.com/avatar.jpg',
      };

      mockUseSession.mockReturnValue({
        data: { user: mockUser, expires: '2024-01-01' },
        status: 'authenticated',
        update: jest.fn(),
      });

      render(<Header />);
      
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('data-alt', 'User');
    });
  });
}); 