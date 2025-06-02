import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Footer from '../Footer';

// Mock Next.js components
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, className, ...props }: any) => (
    <img 
      src={src} 
      alt={alt} 
      width={width} 
      height={height} 
      className={className}
      {...props}
    />
  ),
}));

describe('Footer', () => {
  beforeEach(() => {
    // Mock current year to make tests deterministic
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders footer with correct structure', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass(
        'w-full',
        'py-8',
        'bg-gradient-to-br',
        'from-blue-50',
        'to-purple-50',
        'text-center',
        'mt-8',
        'border-t',
        'border-blue-200'
      );
    });

    it('renders logo and company name', () => {
      render(<Footer />);

      const logo = screen.getByAltText('209Jobs Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logo.png');
      expect(logo).toHaveAttribute('width', '32');
      expect(logo).toHaveAttribute('height', '32');
      expect(logo).toHaveClass('w-6', 'h-6');

      const companyName = screen.getByText('209Jobs');
      expect(companyName).toBeInTheDocument();
      expect(companyName).toHaveClass('text-gray-700', 'text-sm', 'font-medium');
    });

    it('renders copyright notice with current year', () => {
      render(<Footer />);

      const copyright = screen.getByText('© 2024 Voodoo Rodeo LLC. All rights reserved.');
      expect(copyright).toBeInTheDocument();
      expect(copyright).toHaveClass('text-gray-700', 'text-sm');
    });

    it('renders tagline', () => {
      render(<Footer />);

      const tagline = screen.getByText('Connecting talent with opportunity.');
      expect(tagline).toBeInTheDocument();
      expect(tagline).toHaveClass('text-gray-500', 'text-xs');
    });

    it('renders navigation links', () => {
      render(<Footer />);

      const contactLink = screen.getByRole('link', { name: 'Contact' });
      expect(contactLink).toBeInTheDocument();
      expect(contactLink).toHaveAttribute('href', '/contact');

      const twitterLink = screen.getByRole('link', { name: 'Twitter' });
      expect(twitterLink).toBeInTheDocument();
      expect(twitterLink).toHaveAttribute('href', '#');

      const linkedinLink = screen.getByRole('link', { name: 'LinkedIn' });
      expect(linkedinLink).toBeInTheDocument();
      expect(linkedinLink).toHaveAttribute('href', '#');
    });
  });

  describe('Logo and Brand', () => {
    it('logo link navigates to home page', () => {
      render(<Footer />);

      const logoLink = screen.getByRole('link', { name: /209jobs logo/i });
      expect(logoLink).toHaveAttribute('href', '/');
      expect(logoLink).toHaveClass('flex', 'items-center', 'space-x-2');
    });

    it('renders logo with correct attributes', () => {
      render(<Footer />);

      const logo = screen.getByAltText('209Jobs Logo');
      expect(logo).toHaveAttribute('src', '/logo.png');
      expect(logo).toHaveAttribute('width', '32');
      expect(logo).toHaveAttribute('height', '32');
      expect(logo).toHaveClass('w-6', 'h-6');
    });

    it('company name is part of the logo link', () => {
      render(<Footer />);

      const logoLink = screen.getByRole('link', { name: /209jobs logo/i });
      expect(logoLink).toContainElement(screen.getByText('209Jobs'));
    });
  });

  describe('Copyright and Legal', () => {
    it('displays dynamic copyright year', () => {
      // Test with different years
      jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2025);
      render(<Footer />);

      expect(screen.getByText('© 2025 Voodoo Rodeo LLC. All rights reserved.')).toBeInTheDocument();
    });

    it('copyright has correct styling', () => {
      render(<Footer />);

      const copyright = screen.getByText(/© \d{4} Voodoo Rodeo LLC\. All rights reserved\./);
      expect(copyright).toHaveClass('text-gray-700', 'text-sm');
    });
  });

  describe('Navigation Links', () => {
    it('all links have proper styling', () => {
      render(<Footer />);

      const links = screen.getAllByRole('link').filter(link => 
        link.textContent === 'Contact' || 
        link.textContent === 'Twitter' || 
        link.textContent === 'LinkedIn'
      );

      links.forEach(link => {
        expect(link).toHaveClass(
          'text-blue-600',
          'hover:underline',
          'text-sm'
        );
      });
    });

    it('contact link points to correct page', () => {
      render(<Footer />);

      const contactLink = screen.getByRole('link', { name: 'Contact' });
      expect(contactLink).toHaveAttribute('href', '/contact');
    });

    it('social media links are placeholders', () => {
      render(<Footer />);

      const twitterLink = screen.getByRole('link', { name: 'Twitter' });
      const linkedinLink = screen.getByRole('link', { name: 'LinkedIn' });

      expect(twitterLink).toHaveAttribute('href', '#');
      expect(linkedinLink).toHaveAttribute('href', '#');
    });

    it('handles link interactions', async () => {
      const user = userEvent.setup();
      render(<Footer />);

      const contactLink = screen.getByRole('link', { name: 'Contact' });
      
      // Focus the link
      await user.tab();
      // The first focusable element might be the logo link, so tab to contact
      contactLink.focus();
      
      expect(contactLink).toHaveFocus();
    });
  });

  describe('Layout and Responsive Design', () => {
    it('has responsive flex layout', () => {
      render(<Footer />);

      const container = screen.getByRole('contentinfo').firstElementChild;
      expect(container).toHaveClass(
        'max-w-5xl',
        'mx-auto',
        'flex',
        'flex-col',
        'sm:flex-row',
        'items-center',
        'justify-between',
        'gap-4',
        'px-4'
      );
    });

    it('logo section has proper spacing', () => {
      render(<Footer />);

      const logoSection = screen.getByText('209Jobs').closest('div');
      expect(logoSection).toHaveClass('flex', 'items-center', 'space-x-3');
    });

    it('links section has proper spacing', () => {
      render(<Footer />);

      const linksSection = screen.getByRole('link', { name: 'Contact' }).closest('div');
      expect(linksSection).toHaveClass('flex', 'gap-4');
    });
  });

  describe('Accessibility', () => {
    it('uses semantic footer element', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer.tagName).toBe('FOOTER');
    });

    it('all links are keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Footer />);

      const links = screen.getAllByRole('link');
      
      // Should be able to tab through all links
      for (let i = 0; i < links.length; i++) {
        await user.tab();
        expect(document.activeElement).toBe(links[i]);
      }
    });

    it('logo has descriptive alt text', () => {
      render(<Footer />);

      const logo = screen.getByAltText('209Jobs Logo');
      expect(logo).toBeInTheDocument();
    });

    it('links have meaningful text', () => {
      render(<Footer />);

      const contactLink = screen.getByRole('link', { name: 'Contact' });
      const twitterLink = screen.getByRole('link', { name: 'Twitter' });
      const linkedinLink = screen.getByRole('link', { name: 'LinkedIn' });

      expect(contactLink).toHaveAccessibleName('Contact');
      expect(twitterLink).toHaveAccessibleName('Twitter');
      expect(linkedinLink).toHaveAccessibleName('LinkedIn');
    });
  });

  describe('Visual Design', () => {
    it('applies gradient background', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass(
        'bg-gradient-to-br',
        'from-blue-50',
        'to-purple-50'
      );
    });

    it('has border styling', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('border-t', 'border-blue-200');
    });

    it('applies text colors correctly', () => {
      render(<Footer />);

      const companyName = screen.getByText('209Jobs');
      expect(companyName).toHaveClass('text-gray-700');

      const copyright = screen.getByText(/© \d{4} Voodoo Rodeo LLC/);
      expect(copyright).toHaveClass('text-gray-700');

      const tagline = screen.getByText('Connecting talent with opportunity.');
      expect(tagline).toHaveClass('text-gray-500');

      const links = screen.getAllByRole('link').filter(link => 
        link.textContent === 'Contact' || 
        link.textContent === 'Twitter' || 
        link.textContent === 'LinkedIn'
      );
      
      links.forEach(link => {
        expect(link).toHaveClass('text-blue-600');
      });
    });
  });

  describe('Content Verification', () => {
    it('contains all expected text content', () => {
      render(<Footer />);

      expect(screen.getByText('209Jobs')).toBeInTheDocument();
      expect(screen.getByText(/© \d{4} Voodoo Rodeo LLC\. All rights reserved\./)).toBeInTheDocument();
      expect(screen.getByText('Connecting talent with opportunity.')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Twitter')).toBeInTheDocument();
      expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    });

    it('maintains consistent spacing and layout', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('py-8', 'mt-8');

      const container = footer.firstElementChild;
      expect(container).toHaveClass('gap-4');
    });
  });
}); 