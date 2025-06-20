import { UnifiedToastContainer } from '@/components/ui/card';
import { UnifiedModalContainer } from '@/components/ui/card';
import { GlobalLoadingOverlay } from './unified-loading-spinner';

'use client';

import {
  import {
  UIStateProvider,
  UIStateErrorBoundary,
} from '@/components/ui/card';
import {
  import {
  componentRegistry,
  withRegistry,
  createFeedbackComponent,
  createOverlayComponent,
  createUtilityComponent,
  ComponentInfo,
} from '@/lib/ui/component-registry';

// Comprehensive UI provider props
interface ComprehensiveUIProviderProps {
  children: React.ReactNode;
  toastPosition?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  maxToasts?: number;
  enableGlobalLoading?: boolean;
  enableErrorBoundary?: boolean;
  enableDevTools?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

// Theme context for UI components
interface ThemeContextValue {
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

// Theme provider component
function ThemeProvider({
  children,
  initialTheme = 'auto',
}: {
  children: React.ReactNode;
  initialTheme?: 'light' | 'dark' | 'auto';
}) {
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'auto'>(
    initialTheme
  );
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>(
    'light'
  );

  // Resolve auto theme based on system preference
  React.useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = () => {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      };

      updateTheme();
      mediaQuery.addEventListener('change', updateTheme);

      return () => mediaQuery.removeEventListener('change', updateTheme);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  // Apply theme to document
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const contextValue = React.useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
    }),
    [theme, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme
export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Performance monitoring component
function PerformanceMonitor({ children }: { children: React.ReactNode }) {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(Date.now());

  React.useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    // Log performance warnings in development
    if (process.env.NODE_ENV === 'development') {
      if (timeSinceLastRender < 16) {
        // Less than 60fps
        console.warn(
          `UI Provider re-rendered ${renderCount.current} times. Last render took ${timeSinceLastRender}ms`
        );
      }
    }
  });

  return <>{children}</>;
}

// Development tools component
function DevTools({ enabled }: { enabled: boolean }) {
  React.useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') return;

    // Add global dev tools to window
    (window as any).__UI_DEV_TOOLS__ = {
      componentRegistry,
      logComponents: () => {
        console.group('🔧 UI Component Registry');
        const stats = componentRegistry.getStats();
        console.log('📊 Stats:', stats);

        console.group('📦 Components');
        componentRegistry.getAll().forEach((component: ComponentInfo) => {
          console.log(`${component.name} (${component.version})`, {
            category: component.category,
            deprecated: component.deprecated,
            conflicts: componentRegistry.getConflicts(component.name),
          });
        });
        console.groupEnd();

        console.groupEnd();
      },
      checkConflicts: () => {
        const conflicts = componentRegistry.export().conflicts;
        if (conflicts.length === 0) {
          console.log('✅ No component conflicts');
        } else {
          console.group('⚠️ Component Conflicts');
          conflicts.forEach(([name, versions]: [string, string[]]) => {
            console.warn(`${name}: ${versions.join(', ')}`);
          });
          console.groupEnd();
        }
      },
    };

    console.log('🔧 UI Dev Tools available at window.__UI_DEV_TOOLS__');
  }, [enabled]);

  return null;
}

// Main comprehensive UI provider
function ComprehensiveUIProviderCore({
  children,
  toastPosition = 'top-right',
  maxToasts = 5,
  enableGlobalLoading = true,
  enableErrorBoundary = true,
  enableDevTools = false,
  theme = 'auto',
  className = '',
}: ComprehensiveUIProviderProps) {
  // Register core UI components
  React.useEffect(() => {
    // Register toast system
    componentRegistry.register({
      name: 'UnifiedToastContainer',
      component: UnifiedToastContainer,
      version: '1.0.0',
      category: 'feedback',
      description:
        'Unified toast notification system with centralized state management',
    });

    // Register modal system
    componentRegistry.register({
      name: 'UnifiedModalContainer',
      component: UnifiedModalContainer,
      version: '1.0.0',
      category: 'overlay',
      description:
        'Unified modal system with focus management and accessibility',
    });

    // Register loading system
    componentRegistry.register({
      name: 'GlobalLoadingOverlay',
      component: GlobalLoadingOverlay,
      version: '1.0.0',
      category: 'feedback',
      description: 'Global loading overlay with progress tracking',
    });

    // Create aliases for backward compatibility
    componentRegistry.registerAlias('Toast', 'UnifiedToastContainer');
    componentRegistry.registerAlias('Modal', 'UnifiedModalContainer');
    componentRegistry.registerAlias('Loading', 'GlobalLoadingOverlay');
  }, []);

  const providerContent = (
    <div className={className}>
      <ThemeProvider initialTheme={theme}>
        <UIStateProvider>
          <PerformanceMonitor>
            {children}

            {/* Toast notifications */}
            <UnifiedToastContainer
              position={toastPosition}
              maxToasts={maxToasts}
            />

            {/* Modal system */}
            <UnifiedModalContainer />

            {/* Global loading overlay */}
            {enableGlobalLoading && <GlobalLoadingOverlay />}

            {/* Development tools */}
            <DevTools enabled={enableDevTools} />
          </PerformanceMonitor>
        </UIStateProvider>
      </ThemeProvider>
    </div>
  );

  // Wrap with error boundary if enabled
  if (enableErrorBoundary) {
    return (
      <UIStateErrorBoundary
        fallback={
          <div className="p-8 text-center">
            <h2 className="mb-2 text-xl font-semibold text-red-600">
              UI System Error
            </h2>
            <p className="mb-4 text-gray-600">
              Something went wrong with the UI system. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        }
      >
        {providerContent}
      </UIStateErrorBoundary>
    );
  }

  return providerContent;
}

// Performance optimized version with React.memo
export const ComprehensiveUIProvider = React.memo(ComprehensiveUIProviderCore);

// Hook to access all UI systems
export function useUI() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return {
    mounted,
    registry: componentRegistry,
  };
}

// Higher-order component to wrap apps with the UI provider
export function withComprehensiveUI<P extends object>(
  Component: React.ComponentType<P>,
  options: Partial<ComprehensiveUIProviderProps> = {}
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ComprehensiveUIProvider {...options}>
      <Component {...(props as any)} ref={ref} />
    </ComprehensiveUIProvider>
  ));

  WrappedComponent.displayName = `withComprehensiveUI(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Utility components for common UI patterns
export const UIComponents = {
  // Error boundary for individual components
  ErrorBoundary: React.memo(
    ({
      children,
      fallback,
    }: {
      children: React.ReactNode;
      fallback?: React.ReactNode;
    }) => (
      <UIStateErrorBoundary fallback={fallback}>
        {children}
      </UIStateErrorBoundary>
    )
  ),

  // Loading wrapper
  LoadingWrapper: React.memo(
    ({
      loading,
      children,
      fallback,
    }: {
      loading: boolean;
      children: React.ReactNode;
      fallback?: React.ReactNode;
    }) => {
      if (loading) {
        return fallback || <div className="animate-pulse">Loading...</div>;
      }
      return <>{children}</>;
    }
  ),

  // Conditional renderer
  ConditionalRender: React.memo(
    ({
      condition,
      children,
      fallback,
    }: {
      condition: boolean;
      children: React.ReactNode;
      fallback?: React.ReactNode;
    }) => {
      return condition ? <>{children}</> : <>{fallback}</>;
    }
  ),
};

// Register utility components
withRegistry(UIComponents.ErrorBoundary, {
  name: 'UIErrorBoundary',
  version: '1.0.0',
  category: 'utility',
  description: 'Error boundary for individual UI components',
});

withRegistry(UIComponents.LoadingWrapper, {
  name: 'UILoadingWrapper',
  version: '1.0.0',
  category: 'utility',
  description: 'Loading state wrapper component',
});

withRegistry(UIComponents.ConditionalRender, {
  name: 'UIConditionalRender',
  version: '1.0.0',
  category: 'utility',
  description: 'Conditional rendering utility component',
});

// Export performance optimized versions
export const ComprehensiveUIProviderMemo = React.memo(ComprehensiveUIProvider);
export const ThemeProviderMemo = React.memo(ThemeProvider);

// Default export
export default ComprehensiveUIProvider;
