import React, { useEffect, useRef } from 'react';

  useFocusIndicator,
  useDynamicFocus,
  useRouteFocus,
} from '@/hooks/useFocusManagement';

interface FocusManagerProps {
  children: React.ReactNode;
  enableRouteAnnouncements?: boolean;
  className?: string;
}

// Global focus manager component
export function FocusManager({
  children,
  enableRouteAnnouncements = true,
  className = '',
}: FocusManagerProps) {
  const { isKeyboardUser } = useFocusIndicator();
  const { focusMainContent, announcePageChange } = useRouteFocus();

  // Add keyboard user class to body for CSS targeting
  useEffect(() => {
    if (isKeyboardUser) {
      document.body.classList.add('keyboard-user');
    } else {
      document.body.classList.remove('keyboard-user');
    }
  }, [isKeyboardUser]);

  // Handle route changes for focus management
  useEffect(() => {
    if (enableRouteAnnouncements) {
      const handleRouteChange = () => {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          focusMainContent();
          const title = document.title;
          if (title) {
            announcePageChange(title);
          }
        }, 100);
      };

      // Listen for route changes (Next.js specific)
      window.addEventListener('popstate', handleRouteChange);

      return () => {
        window.removeEventListener('popstate', handleRouteChange);
      };
    }
  }, [enableRouteAnnouncements, focusMainContent, announcePageChange]);

  return <div className={`focus-manager ${className}`}>{children}</div>;
}

// Component for managing focus in dynamic content
interface DynamicContentFocusProps {
  children: React.ReactNode;
  isVisible: boolean;
  ariaLabel?: string;
  role?: string;
  announceChanges?: boolean;
  trapFocus?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function DynamicContentFocus({
  children,
  isVisible,
  ariaLabel,
  role = 'region',
  announceChanges = false,
  trapFocus = false,
  autoFocus = true,
  className = '',
}: DynamicContentFocusProps) {
  const containerRef = useDynamicFocus(isVisible, {
    announceToScreenReader: announceChanges,
    trapFocus,
    autoFocus,
  });

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      role={role}
      aria-label={ariaLabel}
      className={`dynamic-content ${className}`}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

// Component for managing focus in modals
interface ModalFocusProps {
  children: React.ReactNode;
  isOpen: boolean;
  ariaLabel: string;
  onClose?: () => void;
  className?: string;
}

export function ModalFocus({
  children,
  isOpen,
  ariaLabel,
  onClose,
  className = '',
}: ModalFocusProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Focus the modal
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;

        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          modalRef.current.focus();
        }
      }

      // Trap focus within modal
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && onClose) {
          onClose();
        }

        if (event.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[
            focusableElements.length - 1
          ] as HTMLElement;

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Restore body scroll
      document.body.style.overflow = '';

      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`modal-content ${className}`}
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}

// Component for skip links
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className = '' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={`skip-link ${className}`}
      onClick={e => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          (target as HTMLElement).focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }}
    >
      {children}
    </a>
  );
}

// Component for focus announcements
interface FocusAnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  id?: string;
}

export function FocusAnnouncement({
  message,
  priority = 'polite',
  id = 'focus-announcement',
}: FocusAnnouncementProps) {
  return (
    <div id={id} aria-live={priority} aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

export default FocusManager;
