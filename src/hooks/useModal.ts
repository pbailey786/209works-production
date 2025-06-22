import { useState, useEffect, useCallback } from 'react';

interface UseModalOptions {
  onOpen?: () => void;
  onClose?: () => void;
  closeOnEscape?: boolean;
  preventBodyScroll?: boolean;
}

interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useModal(options: UseModalOptions = {}): UseModalReturn {
  const {
    onOpen,
    onClose,
    closeOnEscape = true,
    preventBodyScroll = true,
  } = options;

  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close, closeOnEscape]);

  // Handle body scroll prevention
  useEffect(() => {
    if (!preventBodyScroll) return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, preventBodyScroll]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
