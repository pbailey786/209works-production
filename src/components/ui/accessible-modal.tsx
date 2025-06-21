'use client';

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/modal-accessibility';

export interface AccessibleModalProps
  extends Omit<ModalAccessibilityOptions, 'isOpen' | 'onClose'> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  type?: 'dialog' | 'alertdialog';
  className?: string;
  overlayClassName?: string;
  showCloseButton?: boolean;
  closeButtonLabel?: string;
  preventScrollRestoration?: boolean;
  onAfterOpen?: () => void;
  onAfterClose?: () => void;
  'data-testid'?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4'
};

export function AccessibleModal({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = 'md',
  type = 'dialog',
  className,
  overlayClassName,
  showCloseButton = true,
  closeButtonLabel = 'Close modal',
  preventScrollRestoration = false,
  onAfterOpen,
  onAfterClose,
  initialFocusRef,
  finalFocusRef,
  restoreFocus = true,
  trapFocus = true,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  preventScroll = true,
  'data-testid': testId,
  ...props
}: AccessibleModalProps) {
  // Generate unique IDs for ARIA attributes
  const { modalId, titleId, descriptionId } = useMemo(
    () => createModalId('accessible-modal'),
    []
  );

  // Use modal accessibility hook
  const { modalRef, handleOverlayClick } = useModalAccessibility({
    isOpen,
    onClose,
    initialFocusRef,
    finalFocusRef,
    restoreFocus,
    trapFocus,
    closeOnEscape,
    closeOnOverlayClick,
    preventScroll
  });

  // Create ARIA props
  const ariaProps = useMemo(
    () =>
      createDialogAriaProps(type, {
        titleId: title ? titleId : undefined,
        descriptionId: description ? descriptionId : undefined,
        isModal: true
      }),
    [type, title, titleId, description, descriptionId]
  );

  // Handle lifecycle callbacks
  useEffect(() => {
    if (isOpen && onAfterOpen) {
      const timeoutId = setTimeout(onAfterOpen, 150); // After animation
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, onAfterOpen]);

  useEffect(() => {
    if (!isOpen && onAfterClose) {
      const timeoutId = setTimeout(onAfterClose, 150); // After animation
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, onAfterClose]);

  // Validate accessibility in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isOpen && modalRef.current) {
      const validation = validateModalAccessibility(modalRef.current);
      if (!validation.isValid) {
        console.warn('Modal accessibility issues:', validation.issues);
        console.info('Recommendations:', validation.recommendations);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          'bg-black/50 backdrop-blur-sm',
          overlayClassName
        )}
        onClick={handleOverlayClick}
        data-testid={testId ? `${testId}-overlay` : undefined}
      >
        <motion.div
          ref={modalRef as React.RefObject<HTMLDivElement>}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'relative w-full rounded-lg bg-white shadow-xl',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            sizeClasses[size],
            className
          )}
          onClick={e => e.stopPropagation()}
          id={modalId}
          data-testid={testId}
          {...ariaProps}
          {...props}
        >
          {/* Close button */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className={cn(
                'absolute right-4 top-4 z-10',
                'rounded-sm p-1.5 text-gray-400 hover:text-gray-600',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'transition-colors duration-200'
              )}
              aria-label={closeButtonLabel}
              data-testid={testId ? `${testId}-close` : undefined}
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          )}

          {/* Modal content */}
          <div className="p-6">
            {/* Title */}
            {title && (
              <h2
                id={titleId}
                className="mb-2 text-lg font-semibold text-gray-900"
              >
                {title}
              </h2>
            )}

            {/* Description */}
            {description && (
              <p id={descriptionId} className="mb-4 text-sm text-gray-600">
                {description}
              </p>
            )}

            {/* Children content */}
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Specialized modal components
export interface ConfirmationModalProps
  extends Omit<AccessibleModalProps, 'type' | 'children'> {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'danger' | 'warning';
  isLoading?: boolean;
}

export function ConfirmationModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  onClose,
  variant = 'default',
  isLoading = false,
  ...props
}: ConfirmationModalProps) {
  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
    // Note: Don't auto-close here, let the parent handle it
  };

  const variantStyles = {
    default: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
  };

  return (
    <AccessibleModal
      {...props}
      onClose={onClose}
      type="alertdialog"
      title={title}
      description={message}
      size="sm"
      closeOnOverlayClick={false} // Prevent accidental dismissal
      showCloseButton={false} // Force explicit choice
    >
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium',
            'border border-gray-300 bg-white text-gray-700',
            'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors duration-200'
          )}
        >
          {cancelLabel}
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium text-white',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors duration-200',
            variantStyles[variant]
          )}
        >
          {isLoading ? 'Loading...' : confirmLabel}
        </button>
      </div>
    </AccessibleModal>
  );
}

// Form modal component
export interface FormModalProps extends Omit<AccessibleModalProps, 'children'> {
  title: string;
  children: React.ReactNode;
  onSubmit?: (event: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  showFooter?: boolean;
}

export function FormModal({
  title,
  children,
  onSubmit,
  onClose,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  showFooter = true,
  ...props
}: FormModalProps) {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit?.(event);
  };

  return (
    <AccessibleModal {...props} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">{children}</div>

        {showFooter && (
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium',
                'border border-gray-300 bg-white text-gray-700',
                'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'transition-colors duration-200'
              )}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium text-white',
                'bg-blue-600 hover:bg-blue-700',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'transition-colors duration-200'
              )}
            >
              {isSubmitting ? 'Submitting...' : submitLabel}
            </button>
          </div>
        )}
      </form>
    </AccessibleModal>
  );
}
