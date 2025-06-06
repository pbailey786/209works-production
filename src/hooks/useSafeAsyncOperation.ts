/**
 * Safe Async Operation Hook
 *
 * Prevents memory leaks from async operations by:
 * - Cancelling pending operations on unmount
 * - Preventing state updates after unmount
 * - Providing cleanup mechanisms
 * - Handling race conditions
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  cancelled: boolean;
}

interface AsyncOperationOptions {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

export function useSafeAsyncOperation<T>(
  asyncFn: (signal: AbortSignal) => Promise<T>,
  deps: any[] = [],
  options: AsyncOperationOptions = {}
) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
    cancelled: false,
  });

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);

  const {
    timeout = 30000,
    retryCount = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
    onCancel,
  } = options;

  // Safe state update that checks if component is still mounted
  const safeSetState = useCallback(
    (newState: Partial<AsyncOperationState<T>>) => {
      if (isMountedRef.current) {
        setState(prevState => ({ ...prevState, ...newState }));
      }
    },
    []
  );

  // Execute the async operation with safety checks
  const execute = useCallback(async () => {
    // Cancel any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    safeSetState({
      loading: true,
      error: null,
      cancelled: false,
    });

    try {
      // Set up timeout
      if (timeout > 0) {
        timeoutRef.current = window.setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }, timeout);
      }

      // Execute the async function
      const result = await asyncFn(signal);

      // Clear timeout on success
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Check if operation was cancelled
      if (signal.aborted) {
        safeSetState({
          loading: false,
          cancelled: true,
        });
        onCancel?.();
        return;
      }

      // Update state with result
      safeSetState({
        data: result,
        loading: false,
        error: null,
      });

      // Reset retry count on success
      retryCountRef.current = 0;

      // Call success callback
      onSuccess?.(result);
    } catch (error) {
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Check if operation was cancelled
      if (signal.aborted) {
        safeSetState({
          loading: false,
          cancelled: true,
        });
        onCancel?.();
        return;
      }

      const errorObj =
        error instanceof Error ? error : new Error(String(error));

      // Handle retries
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;

        // Wait before retrying
        setTimeout(() => {
          if (isMountedRef.current) {
            execute();
          }
        }, retryDelay);

        return;
      }

      // Update state with error
      safeSetState({
        loading: false,
        error: errorObj,
      });

      // Call error callback
      onError?.(errorObj);
    }
  }, [
    asyncFn,
    timeout,
    retryCount,
    retryDelay,
    onSuccess,
    onError,
    onCancel,
    safeSetState,
  ]);

  // Cancel the current operation
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    safeSetState({
      loading: false,
      cancelled: true,
    });
    onCancel?.();
  }, [safeSetState, onCancel]);

  // Reset the state
  const reset = useCallback(() => {
    cancel();
    retryCountRef.current = 0;
    safeSetState({
      data: null,
      loading: false,
      error: null,
      cancelled: false,
    });
  }, [cancel, safeSetState]);

  // Execute on dependency change
  useEffect(() => {
    execute();
  }, deps);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      // Cancel any pending operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    execute,
    cancel,
    reset,
    isRetrying: retryCountRef.current > 0,
    retryCount: retryCountRef.current,
  };
}

// Hook for safe fetch operations
export function useSafeFetch<T>(
  url: string | null,
  options: RequestInit = {},
  hookOptions: AsyncOperationOptions = {}
) {
  return useSafeAsyncOperation<T>(
    async signal => {
      if (!url) {
        throw new Error('URL is required');
      }

      const response = await fetch(url, {
        ...options,
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    [url, JSON.stringify(options)],
    hookOptions
  );
}

// Hook for safe API calls with automatic retry
export function useSafeApiCall<T>(
  apiCall: (signal: AbortSignal) => Promise<T>,
  deps: any[] = [],
  options: AsyncOperationOptions = {}
) {
  return useSafeAsyncOperation(apiCall, deps, {
    retryCount: 3,
    retryDelay: 1000,
    timeout: 15000,
    ...options,
  });
}

export default useSafeAsyncOperation;
