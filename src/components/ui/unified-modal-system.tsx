"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cross2Icon } from "@radix-ui/react-icons";
import { cn } from '@/lib/utils';
import { useModal, useFocusManagement } from '@/lib/ui/component-state-manager';
import type { ModalState } from '@/lib/ui/component-state-manager';

// Base modal component with centralized state management
interface UnifiedModalProps {
  modal: ModalState;
  onClose: (id: string) => void;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full w-full h-full',
};

function UnifiedModal({
  modal,
  onClose,
  children,
  className = '',
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}: UnifiedModalProps) {
  const { pushFocus, popFocus } = useFocusManagement();
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);
  
  // Focus management
  React.useEffect(() => {
    if (modal.isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Push to focus stack
      pushFocus(modal.id);
      
      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }
      
      return () => {
        // Pop from focus stack
        popFocus();
        
        // Restore focus to previous element
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [modal.isOpen, modal.id, pushFocus, popFocus]);
  
  // Escape key handler
  React.useEffect(() => {
    if (!modal.isOpen || !closeOnEscape) return;
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose(modal.id);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modal.isOpen, modal.id, onClose, closeOnEscape]);
  
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (modal.isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [modal.isOpen]);
  
  if (!modal.isOpen) return null;
  
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose(modal.id);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`modal-title-${modal.id}`}
      aria-describedby={`modal-description-${modal.id}`}
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative bg-white rounded-lg shadow-xl p-6 m-4',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          sizeClasses[size],
          size !== 'full' && 'max-h-[90vh] overflow-y-auto',
          className
        )}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={() => onClose(modal.id)}
            className={cn(
              'absolute top-4 right-4 p-1 rounded-md',
              'text-gray-400 hover:text-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'transition-colors'
            )}
            aria-label="Close modal"
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
        )}
        
        {children}
      </motion.div>
    </motion.div>
  );
}

// Modal container that manages all modals
export function UnifiedModalContainer() {
  const { modals, removeModal } = useModal();
  
  // Sort modals by timestamp to maintain proper z-index order
  const sortedModals = React.useMemo(() => {
    return [...modals].sort((a, b) => a.timestamp - b.timestamp);
  }, [modals]);
  
  return (
    <AnimatePresence mode="wait">
      {sortedModals.map((modal, index) => (
        <div key={modal.id} style={{ zIndex: 50 + index }}>
          <UnifiedModal
            modal={modal}
            onClose={removeModal}
            size={modal.data?.size}
            closeOnOverlayClick={modal.data?.closeOnOverlayClick}
            closeOnEscape={modal.data?.closeOnEscape}
            showCloseButton={modal.data?.showCloseButton}
            className={modal.data?.className}
          >
            {modal.data?.content}
          </UnifiedModal>
        </div>
      ))}
    </AnimatePresence>
  );
}

// Hook for easy modal management
export function useUnifiedModal() {
  const { addModal, updateModal, removeModal, clearModals, modals } = useModal();
  
  const openModal = React.useCallback((
    content: React.ReactNode,
    options: {
      type?: ModalState['type'];
      size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
      closeOnOverlayClick?: boolean;
      closeOnEscape?: boolean;
      showCloseButton?: boolean;
      className?: string;
      data?: any;
    } = {}
  ) => {
    return addModal({
      isOpen: true,
      type: options.type || 'dialog',
      data: {
        content,
        size: options.size || 'md',
        closeOnOverlayClick: options.closeOnOverlayClick ?? true,
        closeOnEscape: options.closeOnEscape ?? true,
        showCloseButton: options.showCloseButton ?? true,
        className: options.className,
        ...options.data,
      },
    });
  }, [addModal]);
  
  const closeModal = React.useCallback((id: string) => {
    removeModal(id);
  }, [removeModal]);
  
  const updateModalData = React.useCallback((id: string, data: any) => {
    updateModal(id, { data });
  }, [updateModal]);
  
  const closeAllModals = React.useCallback(() => {
    clearModals();
  }, [clearModals]);
  
  return {
    openModal,
    closeModal,
    updateModalData,
    closeAllModals,
    modals,
  };
}

// Specific modal types for common use cases
export function ConfirmationModal({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p id="modal-description" className="mt-2 text-sm text-gray-600">
          {message}
        </p>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md',
            'border border-gray-300 text-gray-700 bg-white',
            'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
            'transition-colors'
          )}
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'transition-colors',
            variant === 'destructive'
              ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
          )}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}

// Alert modal for simple notifications
export function AlertModal({
  title,
  message,
  onClose,
  type = 'info',
}: {
  title: string;
  message: string;
  onClose: () => void;
  type?: 'info' | 'success' | 'warning' | 'error';
}) {
  const typeStyles = {
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h2 id="modal-title" className={cn('text-lg font-semibold', typeStyles[type])}>
          {title}
        </h2>
        <p id="modal-description" className="mt-2 text-sm text-gray-600">
          {message}
        </p>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md',
            'bg-blue-600 text-white hover:bg-blue-700',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            'transition-colors'
          )}
        >
          OK
        </button>
      </div>
    </div>
  );
}

// Performance optimized versions
export const UnifiedModalMemo = React.memo(UnifiedModal);
export const UnifiedModalContainerMemo = React.memo(UnifiedModalContainer);

// Default export
export default UnifiedModalContainer; 