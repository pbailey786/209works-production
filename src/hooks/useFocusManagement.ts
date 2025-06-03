import { useEffect, useRef, useCallback, useState } from 'react';

interface FocusManagementOptions {
  announceToScreenReader?: boolean;
  restoreFocusOnUnmount?: boolean;
  trapFocus?: boolean;
  autoFocus?: boolean;
}

// Hook for managing focus announcements to screen readers
export function useFocusAnnouncement() {
  const announcementRef = useRef<HTMLDivElement | null>(null);

  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (!announcementRef.current) {
        // Create announcement element if it doesn't exist
        const element = document.createElement('div');
        element.setAttribute('aria-live', priority);
        element.setAttribute('aria-atomic', 'true');
        element.className = 'sr-only';
        element.id = 'focus-announcement';
        document.body.appendChild(element);
        announcementRef.current = element;
      }

      // Update the aria-live region
      announcementRef.current.setAttribute('aria-live', priority);
      announcementRef.current.textContent = message;

      // Clear the message after a short delay to allow for re-announcements
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 1000);
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (announcementRef.current && announcementRef.current.parentNode) {
        announcementRef.current.parentNode.removeChild(announcementRef.current);
      }
    };
  }, []);

  return { announce };
}

// Hook for managing focus on dynamic content changes
export function useDynamicFocus(
  isVisible: boolean,
  options: FocusManagementOptions = {}
) {
  const {
    announceToScreenReader = false,
    restoreFocusOnUnmount = true,
    trapFocus = false,
    autoFocus = true,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { announce } = useFocusAnnouncement();

  // Save focus when component becomes visible
  useEffect(() => {
    if (isVisible) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      if (autoFocus && containerRef.current) {
        // Focus the container or first focusable element
        const firstFocusable = containerRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;

        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          containerRef.current.focus();
        }

        if (announceToScreenReader) {
          const ariaLabel = containerRef.current.getAttribute('aria-label');
          const role = containerRef.current.getAttribute('role');
          if (ariaLabel) {
            announce(`${role || 'Content'} opened: ${ariaLabel}`);
          }
        }
      }
    }
  }, [isVisible, autoFocus, announceToScreenReader, announce]);

  // Restore focus when component becomes hidden
  useEffect(() => {
    if (!isVisible && restoreFocusOnUnmount && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isVisible, restoreFocusOnUnmount]);

  // Focus trap implementation
  useEffect(() => {
    if (!isVisible || !trapFocus || !containerRef.current) return;

    const container = containerRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const focusableElements = container.querySelectorAll(
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

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, trapFocus]);

  return containerRef;
}

// Hook for managing focus indicators
export function useFocusIndicator() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    let keyboardUsed = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        keyboardUsed = true;
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      if (keyboardUsed) {
        keyboardUsed = false;
        setIsKeyboardUser(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return { isKeyboardUser };
}

// Hook for managing focus on route changes
export function useRouteFocus() {
  const { announce } = useFocusAnnouncement();

  const focusMainContent = useCallback(() => {
    const mainContent = document.getElementById('main-content');
    const h1 = document.querySelector('h1');

    if (mainContent) {
      mainContent.focus();
      announce('Page loaded', 'polite');
    } else if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus();
      announce('Page loaded', 'polite');
    }
  }, [announce]);

  const announcePageChange = useCallback(
    (pageTitle: string) => {
      announce(`Navigated to ${pageTitle}`, 'assertive');
    },
    [announce]
  );

  return { focusMainContent, announcePageChange };
}

// Hook for managing focus in lists and grids
export function useListFocus<T extends HTMLElement>(
  items: T[],
  orientation: 'horizontal' | 'vertical' | 'grid' = 'vertical'
) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const moveFocus = useCallback(
    (direction: 'next' | 'previous' | 'first' | 'last') => {
      let newIndex = focusedIndex;

      switch (direction) {
        case 'next':
          newIndex = Math.min(focusedIndex + 1, items.length - 1);
          break;
        case 'previous':
          newIndex = Math.max(focusedIndex - 1, 0);
          break;
        case 'first':
          newIndex = 0;
          break;
        case 'last':
          newIndex = items.length - 1;
          break;
      }

      if (newIndex !== focusedIndex && items[newIndex]) {
        setFocusedIndex(newIndex);
        items[newIndex].focus();
      }
    },
    [focusedIndex, items]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'grid') {
            event.preventDefault();
            moveFocus('next');
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'grid') {
            event.preventDefault();
            moveFocus('previous');
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'grid') {
            event.preventDefault();
            moveFocus('next');
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'grid') {
            event.preventDefault();
            moveFocus('previous');
          }
          break;
        case 'Home':
          event.preventDefault();
          moveFocus('first');
          break;
        case 'End':
          event.preventDefault();
          moveFocus('last');
          break;
      }
    },
    [orientation, moveFocus]
  );

  // Update tabindex for all items
  useEffect(() => {
    items.forEach((item, index) => {
      if (item) {
        item.tabIndex = index === focusedIndex ? 0 : -1;
      }
    });
  }, [items, focusedIndex]);

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    moveFocus,
  };
}

// Hook for managing focus in modals and overlays
export function useModalFocus(isOpen: boolean) {
  const modalRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { announce } = useFocusAnnouncement();

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

        // Announce modal opening
        const ariaLabel = modalRef.current.getAttribute('aria-label');
        if (ariaLabel) {
          announce(`Dialog opened: ${ariaLabel}`, 'assertive');
        }
      }

      // Trap focus within modal
      const handleKeyDown = (event: KeyboardEvent) => {
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

      // Announce modal closing
      announce('Dialog closed', 'polite');
    }
  }, [isOpen, announce]);

  return modalRef;
}
