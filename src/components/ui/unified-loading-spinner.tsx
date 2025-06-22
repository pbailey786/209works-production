import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLoading } from '@/lib/ui/component-state-manager';

interface UnifiedLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'simple';
  message?: string;
  progress?: number; // 0-100 for progress bar
  className?: string;
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  type?: 'global' | 'component' | 'action';
  id?: string; // For tracking specific loading states
  showGlobalState?: boolean; // Whether to show global loading states
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colorClasses = {
  primary: 'text-blue-600',
  secondary: 'text-purple-600',
  white: 'text-white',
  gray: 'text-gray-400',
};

const progressColorClasses = {
  primary: 'bg-blue-600',
  secondary: 'bg-purple-600',
  white: 'bg-white',
  gray: 'bg-gray-400',
};

export function UnifiedLoadingSpinner({
  size = 'md',
  variant = 'spinner',
  message,
  progress,
  className = '',
  color = 'primary',
  type = 'component',
  id,
  showGlobalState = false,
}: UnifiedLoadingSpinnerProps) {
  const { loadingStates, isLoading } = useLoading();

  // Check if we should show loading based on global state
  const shouldShowLoading = React.useMemo(() => {
    if (showGlobalState) {
      return isLoading(type);
    }
    if (id) {
      return loadingStates.some(state => state.id === id);
    }
    return true; // Show if no specific tracking
  }, [showGlobalState, type, id, loadingStates, isLoading]);

  // Get current loading state if ID is provided
  const currentLoadingState = React.useMemo(() => {
    if (id) {
      return loadingStates.find(state => state.id === id);
    }
    return null;
  }, [id, loadingStates]);

  // Use loading state message and progress if available
  const displayMessage = currentLoadingState?.message || message;
  const displayProgress = currentLoadingState?.progress ?? progress;

  if (!shouldShowLoading) {
    return null;
  }

  const baseClasses = `${sizeClasses[size]} ${colorClasses[color]} ${className}`;

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1" role="status" aria-label="Loading">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className={`h-2 w-2 rounded-full bg-current`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
            <span className="sr-only">Loading...</span>
          </div>
        );

      case 'pulse':
        return (
          <motion.div
            className={`${baseClasses} rounded-full bg-current`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
            role="status"
            aria-label="Loading"
          >
            <span className="sr-only">Loading...</span>
          </motion.div>
        );

      case 'skeleton':
        return (
          <div
            className="animate-pulse space-y-2"
            role="status"
            aria-label="Loading content"
          >
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            <div className="h-4 w-5/6 rounded bg-gray-200"></div>
            <span className="sr-only">Loading content...</span>
          </div>
        );

      case 'simple':
        return (
          <div
            className={cn(
              'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
              sizeClasses[size],
              className
            )}
            role="status"
            aria-label="Loading"
          >
            <span className="sr-only">Loading...</span>
          </div>
        );

      default: // spinner
        return (
          <motion.div
            className={`${baseClasses} rounded-full border-2 border-current border-t-transparent`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
            role="status"
            aria-label="Loading"
          >
            <span className="sr-only">Loading...</span>
          </motion.div>
        );
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      {renderSpinner()}

      {displayMessage && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('mt-2 text-center text-sm', colorClasses[color])}
          role="status"
          aria-live="polite"
        >
          {displayMessage}
        </motion.p>
      )}

      {displayProgress !== undefined && (
        <div className="mt-3 w-full max-w-xs">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{Math.round(displayProgress)}%</span>
          </div>
          <div
            className="h-2 w-full rounded-full bg-gray-200"
            role="progressbar"
            aria-valuenow={displayProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className={cn('h-2 rounded-full', progressColorClasses[color])}
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Global loading overlay component
export function GlobalLoadingOverlay() {
  const { isLoading, loadingStates } = useLoading();

  const globalLoadingState = React.useMemo(() => {
    return loadingStates.find(state => state.type === 'global');
  }, [loadingStates]);

  if (!isLoading('global')) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <UnifiedLoadingSpinner
          size="lg"
          variant="spinner"
          color="primary"
          message={globalLoadingState?.message || 'Loading...'}
          progress={globalLoadingState?.progress}
          className="mb-4"
        />
      </div>
    </motion.div>
  );
}

// Hook for easy loading management
export function useLoadingSpinner() {
  const { addLoading, removeLoading, updateLoading } = useLoading();

  const startLoading = React.useCallback(
    (
      options: {
        message?: string;
        type?: 'global' | 'component' | 'action';
        progress?: number;
      } = {}
    ) => {
      return addLoading({
        message: options.message,
        type: options.type || 'component',
        progress: options.progress,
      });
    },
    [addLoading]
  );

  const stopLoading = React.useCallback(
    (id: string) => {
      removeLoading(id);
    },
    [removeLoading]
  );

  const updateLoadingProgress = React.useCallback(
    (id: string, progress: number, message?: string) => {
      updateLoading(id, { progress, message });
    },
    [updateLoading]
  );

  return {
    startLoading,
    stopLoading,
    updateLoadingProgress,
  };
}

// Performance optimized version
export const UnifiedLoadingSpinnerMemo = React.memo(UnifiedLoadingSpinner);
export const GlobalLoadingOverlayMemo = React.memo(GlobalLoadingOverlay);

// Default export for backward compatibility
export default UnifiedLoadingSpinner;
