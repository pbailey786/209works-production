import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect
} from 'react';

// Types for UI state management
export interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  timestamp: number;
}

export interface LoadingState {
  id: string;
  message?: string;
  progress?: number;
  type: 'global' | 'component' | 'action';
  timestamp: number;
}

export interface ModalState {
  id: string;
  isOpen: boolean;
  type: 'dialog' | 'sheet' | 'popover' | 'alert';
  data?: any;
  timestamp: number;
}

export interface UIState {
  toasts: ToastState[];
  loadingStates: LoadingState[];
  modals: ModalState[];
  focusStack: string[];
  maxToasts: number;
  maxLoadingStates: number;
}

// Action types for state management
export type UIAction =
  | { type: 'ADD_TOAST'; payload: Omit<ToastState, 'id' | 'timestamp'> }
  | { type: 'REMOVE_TOAST'; payload: { id: string } }
  | { type: 'CLEAR_TOASTS' }
  | { type: 'ADD_LOADING'; payload: Omit<LoadingState, 'id' | 'timestamp'> }
  | {
      type: 'UPDATE_LOADING';
      payload: { id: string; progress?: number; message?: string };
    }
  | { type: 'REMOVE_LOADING'; payload: { id: string } }
  | { type: 'CLEAR_LOADING' }
  | { type: 'ADD_MODAL'; payload: Omit<ModalState, 'id' | 'timestamp'> }
  | {
      type: 'UPDATE_MODAL';
      payload: { id: string; isOpen?: boolean; data?: any };
    }
  | { type: 'REMOVE_MODAL'; payload: { id: string } }
  | { type: 'CLEAR_MODALS' }
  | { type: 'PUSH_FOCUS'; payload: { id: string } }
  | { type: 'POP_FOCUS' }
  | { type: 'CLEAR_FOCUS_STACK' };

// Initial state
const initialState: UIState = {
  toasts: [],
  loadingStates: [],
  modals: [],
  focusStack: [],
  maxToasts: 5,
  maxLoadingStates: 10
};

// Utility functions for ID generation
const generateId = (): string => {
  return `ui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// State reducer with comprehensive error handling
function uiReducer(state: UIState, action: UIAction): UIState {
  try {
    switch (action.type) {
      case 'ADD_TOAST': {
        const newToast: ToastState = {
          ...action.payload,
          id: generateId(),
          timestamp: Date.now()
        };

        // Limit number of toasts to prevent memory issues
        const updatedToasts = [newToast, ...state.toasts].slice(
          0,
          state.maxToasts
        );

        return {
          ...state,
          toasts: updatedToasts
        };
      }

      case 'REMOVE_TOAST': {
        return {
          ...state,
          toasts: state.toasts.filter(toast => toast.id !== action.payload.id)
        };
      }

      case 'CLEAR_TOASTS': {
        return {
          ...state,
          toasts: []
        };
      }

      case 'ADD_LOADING': {
        const newLoading: LoadingState = {
          ...action.payload,
          id: generateId(),
          timestamp: Date.now()
        };

        // Limit number of loading states
        const updatedLoadingStates = [newLoading, ...state.loadingStates].slice(
          0,
          state.maxLoadingStates
        );

        return {
          ...state,
          loadingStates: updatedLoadingStates
        };
      }

      case 'UPDATE_LOADING': {
        return {
          ...state,
          loadingStates: state.loadingStates.map(loading =>
            loading.id === action.payload.id
              ? { ...loading, ...action.payload }
              : loading
          )
        };
      }

      case 'REMOVE_LOADING': {
        return {
          ...state,
          loadingStates: state.loadingStates.filter(
            loading => loading.id !== action.payload.id
          )
        };
      }

      case 'CLEAR_LOADING': {
        return {
          ...state,
          loadingStates: []
        };
      }

      case 'ADD_MODAL': {
        const newModal: ModalState = {
          ...action.payload,
          id: generateId(),
          timestamp: Date.now()
        };

        return {
          ...state,
          modals: [...state.modals, newModal]
        };
      }

      case 'UPDATE_MODAL': {
        return {
          ...state,
          modals: state.modals.map(modal =>
            modal.id === action.payload.id
              ? { ...modal, ...action.payload }
              : modal
          )
        };
      }

      case 'REMOVE_MODAL': {
        return {
          ...state,
          modals: state.modals.filter(modal => modal.id !== action.payload.id)
        };
      }

      case 'CLEAR_MODALS': {
        return {
          ...state,
          modals: []
        };
      }

      case 'PUSH_FOCUS': {
        return {
          ...state,
          focusStack: [...state.focusStack, action.payload.id]
        };
      }

      case 'POP_FOCUS': {
        return {
          ...state,
          focusStack: state.focusStack.slice(0, -1)
        };
      }

      case 'CLEAR_FOCUS_STACK': {
        return {
          ...state,
          focusStack: []
        };
      }

      default:
        console.warn('Unknown UI action type:', (action as any).type);
        return state;
    }
  } catch (error) {
    console.error('Error in UI reducer:', error, 'Action:', action);
    return state; // Return current state on error to prevent crashes
  }
}

// Context for UI state management
const UIStateContext = createContext<{
  state: UIState;
  dispatch: React.Dispatch<UIAction>;
} | null>(null);

// Provider component with cleanup and error handling
export function UIStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);
  const cleanupTimersRef = useRef<Set<NodeJS.Timeout>>(new Set());

  // Cleanup function for timers
  const addCleanupTimer = useCallback((timer: NodeJS.Timeout) => {
    cleanupTimersRef.current.add(timer);
  }, []);

  const removeCleanupTimer = useCallback((timer: NodeJS.Timeout) => {
    cleanupTimersRef.current.delete(timer);
    clearTimeout(timer);
  }, []);

  // Auto-cleanup expired toasts
  useEffect(() => {
    const activeTimers = new Set<NodeJS.Timeout>();

    state.toasts.forEach(toast => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          dispatch({ type: 'REMOVE_TOAST', payload: { id: toast.id } });
          activeTimers.delete(timer);
        }, toast.duration);

        activeTimers.add(timer);
        addCleanupTimer(timer);
      }
    });

    // Cleanup function
    return () => {
      activeTimers.forEach(timer => {
        clearTimeout(timer);
        removeCleanupTimer(timer);
      });
    };
  }, [state.toasts, addCleanupTimer, removeCleanupTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimersRef.current.forEach(timer => {
        clearTimeout(timer);
      });
      cleanupTimersRef.current.clear();
    };
  }, []);

  const value = React.useMemo(
    () => ({
      state,
      dispatch
    }),
    [state]
  );

  return (
    <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>
  );
}

// Custom hook for accessing UI state
export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
}

// Custom hooks for specific UI components
export function useToast() {
  const { state, dispatch } = useUIState();

  const addToast = useCallback(
    (toast: Omit<ToastState, 'id' | 'timestamp'>) => {
      dispatch({ type: 'ADD_TOAST', payload: toast });
    },
    [dispatch]
  );

  const removeToast = useCallback(
    (id: string) => {
      dispatch({ type: 'REMOVE_TOAST', payload: { id } });
    },
    [dispatch]
  );

  const clearToasts = useCallback(() => {
    dispatch({ type: 'CLEAR_TOASTS' });
  }, [dispatch]);

  return {
    toasts: state.toasts,
    addToast,
    removeToast,
    clearToasts
  };
}

export function useLoading() {
  const { state, dispatch } = useUIState();

  const addLoading = useCallback(
    (loading: Omit<LoadingState, 'id' | 'timestamp'>) => {
      dispatch({ type: 'ADD_LOADING', payload: loading });
      return generateId(); // Return ID for tracking
    },
    [dispatch]
  );

  const updateLoading = useCallback(
    (id: string, updates: { progress?: number; message?: string }) => {
      dispatch({ type: 'UPDATE_LOADING', payload: { id, ...updates } });
    },
    [dispatch]
  );

  const removeLoading = useCallback(
    (id: string) => {
      dispatch({ type: 'REMOVE_LOADING', payload: { id } });
    },
    [dispatch]
  );

  const clearLoading = useCallback(() => {
    dispatch({ type: 'CLEAR_LOADING' });
  }, [dispatch]);

  const isLoading = useCallback(
    (type?: LoadingState['type']) => {
      if (type) {
        return state.loadingStates.some(loading => loading.type === type);
      }
      return state.loadingStates.length > 0;
    },
    [state.loadingStates]
  );

  return {
    loadingStates: state.loadingStates,
    addLoading,
    updateLoading,
    removeLoading,
    clearLoading,
    isLoading
  };
}

export function useModal() {
  const { state, dispatch } = useUIState();

  const addModal = useCallback(
    (modal: Omit<ModalState, 'id' | 'timestamp'>) => {
      const id = generateId();
      dispatch({ type: 'ADD_MODAL', payload: modal });
      return id;
    },
    [dispatch]
  );

  const updateModal = useCallback(
    (id: string, updates: { isOpen?: boolean; data?: any }) => {
      dispatch({ type: 'UPDATE_MODAL', payload: { id, ...updates } });
    },
    [dispatch]
  );

  const removeModal = useCallback(
    (id: string) => {
      dispatch({ type: 'REMOVE_MODAL', payload: { id } });
    },
    [dispatch]
  );

  const clearModals = useCallback(() => {
    dispatch({ type: 'CLEAR_MODALS' });
  }, [dispatch]);

  return {
    modals: state.modals,
    addModal,
    updateModal,
    removeModal,
    clearModals
  };
}

export function useFocusManagement() {
  const { state, dispatch } = useUIState();

  const pushFocus = useCallback(
    (id: string) => {
      dispatch({ type: 'PUSH_FOCUS', payload: { id } });
    },
    [dispatch]
  );

  const popFocus = useCallback(() => {
    dispatch({ type: 'POP_FOCUS' });
  }, [dispatch]);

  const clearFocusStack = useCallback(() => {
    dispatch({ type: 'CLEAR_FOCUS_STACK' });
  }, [dispatch]);

  const getCurrentFocus = useCallback(() => {
    return state.focusStack[state.focusStack.length - 1] || null;
  }, [state.focusStack]);

  return {
    focusStack: state.focusStack,
    pushFocus,
    popFocus,
    clearFocusStack,
    getCurrentFocus
  };
}

// Performance optimization utilities
export const UIStateProviderMemo = React.memo(UIStateProvider);

// Error boundary for UI state management
export class UIStateErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('UI State Error Boundary caught an error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UI State Error Boundary error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 text-center text-red-600">
            <h2 className="text-lg font-semibold">UI State Error</h2>
            <p>Something went wrong with the UI state management.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
