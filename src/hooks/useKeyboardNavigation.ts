import { useCallback, useEffect, useRef } from 'react';

interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    onEnter,
    onSpace,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onHome,
    onEnd,
    preventDefault = true,
    stopPropagation = false,
  } = options;

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      let handled = false;

      switch (event.key) {
        case 'Enter':
          if (onEnter) {
            onEnter();
            handled = true;
          }
          break;
        case ' ':
          if (onSpace) {
            onSpace();
            handled = true;
          }
          break;
        case 'Escape':
          if (onEscape) {
            onEscape();
            handled = true;
          }
          break;
        case 'ArrowUp':
          if (onArrowUp) {
            onArrowUp();
            handled = true;
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            onArrowDown();
            handled = true;
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            onArrowLeft();
            handled = true;
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            onArrowRight();
            handled = true;
          }
          break;
        case 'Home':
          if (onHome) {
            onHome();
            handled = true;
          }
          break;
        case 'End':
          if (onEnd) {
            onEnd();
            handled = true;
          }
          break;
      }

      if (handled) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
      }
    },
    [
      onEnter,
      onSpace,
      onEscape,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onHome,
      onEnd,
      preventDefault,
      stopPropagation,
    ]
  );

  return { handleKeyDown };
}

// Hook for managing focus within a container (useful for modals, dropdowns, etc.)
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
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

    // Focus the first element when trap becomes active
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
}

// Hook for managing roving tabindex (useful for radio groups, toolbars, etc.)
export function useRovingTabIndex<T extends HTMLElement>(
  items: T[],
  activeIndex: number,
  onIndexChange: (index: number) => void,
  orientation: 'horizontal' | 'vertical' | 'both' = 'horizontal'
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent, currentIndex: number) => {
      let newIndex = currentIndex;
      let handled = false;

      switch (event.key) {
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            newIndex = (currentIndex + 1) % items.length;
            handled = true;
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            newIndex = (currentIndex - 1 + items.length) % items.length;
            handled = true;
          }
          break;
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            newIndex = (currentIndex + 1) % items.length;
            handled = true;
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            newIndex = (currentIndex - 1 + items.length) % items.length;
            handled = true;
          }
          break;
        case 'Home':
          newIndex = 0;
          handled = true;
          break;
        case 'End':
          newIndex = items.length - 1;
          handled = true;
          break;
      }

      if (handled) {
        event.preventDefault();
        onIndexChange(newIndex);
        items[newIndex]?.focus();
      }
    },
    [items, onIndexChange, orientation]
  );

  // Set up tabindex for all items
  useEffect(() => {
    items.forEach((item, index) => {
      if (item) {
        item.tabIndex = index === activeIndex ? 0 : -1;
      }
    });
  }, [items, activeIndex]);

  return { handleKeyDown };
}

// Hook for managing focus restoration
export function useFocusRestore() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  return { saveFocus, restoreFocus };
}
