// Modal and Dialog accessibility utilities for WCAG 2.1 compliance

import { useEffect, useRef, useCallback } from 'react';

export interface ModalAccessibilityOptions {
  isOpen: boolean;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLElement>;
  finalFocusRef?: React.RefObject<HTMLElement>;
  restoreFocus?: boolean;
  trapFocus?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  preventScroll?: boolean;
}

export interface DialogAriaProps {
  role: 'dialog' | 'alertdialog';
  'aria-modal': boolean;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-live'?: 'polite' | 'assertive' | 'off';
}

/**
 * Creates proper ARIA attributes for dialog components
 */
export function createDialogAriaProps(
  type: 'dialog' | 'alertdialog' = 'dialog',
  options: {
    titleId?: string;
    descriptionId?: string;
    isModal?: boolean;
    liveRegion?: 'polite' | 'assertive' | 'off';
  } = {}
): DialogAriaProps {
  const props: DialogAriaProps = {
    role: type,
    'aria-modal': options.isModal !== false,
  };

  if (options.titleId) {
    props['aria-labelledby'] = options.titleId;
  }

  if (options.descriptionId) {
    props['aria-describedby'] = options.descriptionId;
  }

  if (options.liveRegion) {
    props['aria-live'] = options.liveRegion;
  }

  return props;
}

/**
 * Gets all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'audio[controls]',
    'video[controls]',
    'details > summary',
    'iframe'
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors))
    .filter((element) => {
      // Additional checks for visibility and interactivity
      const el = element as HTMLElement;
      
      // Skip elements with aria-hidden
      if (el.hasAttribute('aria-hidden') && el.getAttribute('aria-hidden') === 'true') {
        return false;
      }
      
      // In test environments like JSDOM, getComputedStyle might not work as expected
      // So we'll do basic checks that work in both real browsers and test environments
      try {
        const style = window.getComputedStyle(el);
        
        // Check for display: none and visibility: hidden
        if (style.display === 'none' || style.visibility === 'hidden') {
          return false;
        }
        
        // In JSDOM, offsetWidth/offsetHeight might always be 0
        // So we'll only check these in real browser environments
        if (typeof window !== 'undefined' && window.navigator && !window.navigator.userAgent.includes('jsdom')) {
          if (el.offsetWidth === 0 && el.offsetHeight === 0) {
            return false;
          }
        }
      } catch (error) {
        // If getComputedStyle fails (like in some test environments), 
        // just check basic attributes
        if (el.style.display === 'none' || el.style.visibility === 'hidden') {
          return false;
        }
      }
      
      return true;
    }) as HTMLElement[];
}

/**
 * Custom hook for managing modal accessibility
 */
export function useModalAccessibility({
  isOpen,
  onClose,
  initialFocusRef,
  finalFocusRef,
  restoreFocus = true,
  trapFocus = true,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  preventScroll = true,
}: ModalAccessibilityOptions) {
  const modalRef = useRef<HTMLElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  // Handle initial focus when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Store the currently focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Prevent body scroll
    if (preventScroll) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, preventScroll]);

  // Handle focus management
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusInitialElement = () => {
      let elementToFocus: HTMLElement | null = null;

      if (initialFocusRef?.current) {
        elementToFocus = initialFocusRef.current;
      } else {
        // Find the first focusable element in the modal
        const focusableElements = getFocusableElements(modalRef.current!);
        elementToFocus = focusableElements[0] || modalRef.current;
      }

      if (elementToFocus) {
        elementToFocus.focus();
        lastFocusedElementRef.current = elementToFocus;
      }
    };

    // Use a small delay to ensure the modal is rendered
    const timeoutId = setTimeout(focusInitialElement, 100);

    return () => clearTimeout(timeoutId);
  }, [isOpen, initialFocusRef]);

  // Handle focus restoration when modal closes
  useEffect(() => {
    if (isOpen) return;

    if (restoreFocus && previousActiveElementRef.current) {
      const elementToFocus = finalFocusRef?.current || previousActiveElementRef.current;
      
      // Use a small delay to ensure the modal is fully unmounted
      const timeoutId = setTimeout(() => {
        if (elementToFocus && document.contains(elementToFocus)) {
          elementToFocus.focus();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, restoreFocus, finalFocusRef]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen || !modalRef.current) return;

    // Close on Escape key
    if (closeOnEscape && event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    // Handle focus trapping
    if (trapFocus && event.key === 'Tab') {
      const focusableElements = getFocusableElements(modalRef.current);
      
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (activeElement === firstElement || !focusableElements.includes(activeElement)) {
          event.preventDefault();
          lastElement.focus();
          lastFocusedElementRef.current = lastElement;
        }
      } else {
        // Tab: moving forwards
        if (activeElement === lastElement || !focusableElements.includes(activeElement)) {
          event.preventDefault();
          firstElement.focus();
          lastFocusedElementRef.current = firstElement;
        }
      }
    }
  }, [isOpen, onClose, closeOnEscape, trapFocus]);

  // Handle overlay clicks
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose, closeOnOverlayClick]);

  // Attach keyboard event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return {
    modalRef,
    handleOverlayClick,
    modalProps: {
      ref: modalRef,
      onKeyDown: handleKeyDown,
    },
  };
}

/**
 * Hook for managing tab navigation within a modal
 */
export function useTabNavigation(containerRef: React.RefObject<HTMLElement>, isActive: boolean = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive || !containerRef.current || event.key !== 'Tab') return;

    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length === 0) return;

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number;

    if (event.shiftKey) {
      // Shift + Tab: move backwards
      nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    } else {
      // Tab: move forwards
      nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
    }

    event.preventDefault();
    focusableElements[nextIndex].focus();
  }, [containerRef, isActive]);

  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isActive, handleKeyDown]);
}

/**
 * Hook for managing arrow key navigation in tab lists
 */
export function useArrowKeyNavigation(
  containerRef: React.RefObject<HTMLElement>,
  orientation: 'horizontal' | 'vertical' = 'horizontal',
  isActive: boolean = true
) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive || !containerRef.current) return;

    const isHorizontal = orientation === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    if (![nextKey, prevKey, 'Home', 'End'].includes(event.key)) return;

    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length === 0) return;

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number;

    switch (event.key) {
      case nextKey:
        nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
        break;
      case prevKey:
        nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = focusableElements.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    focusableElements[nextIndex].focus();
  }, [containerRef, orientation, isActive]);

  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isActive, handleKeyDown]);
}

/**
 * Validates modal accessibility compliance
 */
export function validateModalAccessibility(modalElement: HTMLElement): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for required ARIA attributes
  if (!modalElement.hasAttribute('role')) {
    issues.push('Modal missing role attribute');
    recommendations.push('Add role="dialog" or role="alertdialog"');
  }

  if (!modalElement.hasAttribute('aria-modal')) {
    issues.push('Modal missing aria-modal attribute');
    recommendations.push('Add aria-modal="true"');
  }

  if (!modalElement.hasAttribute('aria-labelledby') && !modalElement.hasAttribute('aria-label')) {
    issues.push('Modal missing accessible name');
    recommendations.push('Add aria-labelledby pointing to title or aria-label');
  }

  // Check for focusable elements
  const focusableElements = getFocusableElements(modalElement);
  if (focusableElements.length === 0) {
    issues.push('Modal has no focusable elements');
    recommendations.push('Ensure modal contains at least one focusable element');
  }

  // Check for close button
  const closeButtons = modalElement.querySelectorAll('[aria-label*="close" i], [aria-label*="dismiss" i]');
  if (closeButtons.length === 0) {
    recommendations.push('Consider adding a clearly labeled close button');
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Creates a unique ID for modal elements
 */
export function createModalId(prefix: string = 'modal'): {
  modalId: string;
  titleId: string;
  descriptionId: string;
} {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const uniqueId = `${prefix}-${timestamp}-${random}`;

  return {
    modalId: uniqueId,
    titleId: `${uniqueId}-title`,
    descriptionId: `${uniqueId}-description`,
  };
} 