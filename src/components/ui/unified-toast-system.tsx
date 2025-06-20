import { motion, AnimatePresence } from '@/components/ui/card';
import { Cross2Icon } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from '@/components/ui/card';
import { cn } from '@/components/ui/card';
import { useToast as useUIToast } from '@/lib/ui/component-state-manager';
import type { ToastState } from '@/lib/ui/component-state-manager';

'use client';


// Unified toast component that works with centralized state
interface UnifiedToastProps {
  toast: ToastState;
  onClose: (id: string) => void;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
}

const typeIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const typeStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

const iconStyles = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
};

function UnifiedToast({
  toast,
  onClose,
  position = 'top-right',
}: UnifiedToastProps) {
  const Icon = typeIcons[toast.type];

  // Auto-dismiss timer
  React.useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'fixed z-50 w-full max-w-sm rounded-lg border p-4 shadow-lg',
        'pointer-events-auto',
        typeStyles[toast.type],
        getPositionClasses()
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn('mt-0.5 h-5 w-5 flex-shrink-0', iconStyles[toast.type])}
        />

        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-medium">{toast.message}</p>
        </div>

        <button
          onClick={() => onClose(toast.id)}
          className={cn(
            'flex-shrink-0 rounded-md p-1 transition-colors',
            'hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2',
            toast.type === 'error'
              ? 'focus:ring-red-500'
              : toast.type === 'success'
                ? 'focus:ring-green-500'
                : toast.type === 'warning'
                  ? 'focus:ring-yellow-500'
                  : 'focus:ring-blue-500'
          )}
          aria-label="Close notification"
        >
          <Cross2Icon className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Toast container that manages multiple toasts
export function UnifiedToastContainer({
  position = 'top-right',
  maxToasts = 5,
}: {
  position?: UnifiedToastProps['position'];
  maxToasts?: number;
}) {
  const { toasts, removeToast } = useUIToast();

  // Limit displayed toasts
  const displayedToasts = React.useMemo(() => {
    return toasts.slice(0, maxToasts);
  }, [toasts, maxToasts]);

  const getContainerClasses = () => {
    const baseClasses = 'fixed z-50 flex flex-col gap-2 pointer-events-none';

    switch (position) {
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'top-center':
        return `${baseClasses} top-4 left-1/2 -translate-x-1/2`;
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'bottom-center':
        return `${baseClasses} bottom-4 left-1/2 -translate-x-1/2`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  return (
    <div className={getContainerClasses()}>
      <AnimatePresence mode="popLayout">
        {displayedToasts.map(toast => (
          <UnifiedToast
            key={toast.id}
            toast={toast}
            onClose={removeToast}
            position={position}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for easy toast management with backward compatibility
export function useUnifiedToast() {
  const { addToast, removeToast, clearToasts, toasts } = useUIToast();

  const toast = React.useCallback(
    (
      message: string,
      type: ToastState['type'] = 'info',
      duration: number = 5000
    ) => {
      addToast({
        message,
        type,
        duration,
      });
    },
    [addToast]
  );

  const success = React.useCallback(
    (message: string, duration?: number) => {
      toast(message, 'success', duration);
    },
    [toast]
  );

  const error = React.useCallback(
    (message: string, duration?: number) => {
      toast(message, 'error', duration);
    },
    [toast]
  );

  const info = React.useCallback(
    (message: string, duration?: number) => {
      toast(message, 'info', duration);
    },
    [toast]
  );

  const warning = React.useCallback(
    (message: string, duration?: number) => {
      toast(message, 'warning', duration);
    },
    [toast]
  );

  return {
    toast,
    success,
    error,
    info,
    warning,
    remove: removeToast,
    clear: clearToasts,
    toasts,
  };
}

// Backward compatibility wrapper for the old Toast component
export function LegacyToastWrapper({
  message,
  type = 'info',
  open,
  onClose,
  autoHideDuration = 3000,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  open: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}) {
  const { addToast } = useUIToast();
  const toastIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (open && !toastIdRef.current) {
      addToast({
        message,
        type,
        duration: autoHideDuration,
      });

      // Auto-close after duration
      const timer = setTimeout(() => {
        onClose();
        toastIdRef.current = null;
      }, autoHideDuration);

      return () => {
        clearTimeout(timer);
        toastIdRef.current = null;
      };
    }
  }, [open, message, type, autoHideDuration, addToast, onClose]);

  React.useEffect(() => {
    if (!open) {
      toastIdRef.current = null;
    }
  }, [open]);

  // This component doesn't render anything - it just manages state
  return null;
}

// Performance optimized versions
export const UnifiedToastMemo = React.memo(UnifiedToast);
export const UnifiedToastContainerMemo = React.memo(UnifiedToastContainer);

// Default export
export default UnifiedToastContainer;
