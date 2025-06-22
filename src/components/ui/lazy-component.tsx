import React, { Suspense, lazy, ComponentType } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LazyComponentProps {
  fallback?: React.ReactNode;
  className?: string;
  errorBoundary?: boolean;
}

interface LazyWrapperProps extends LazyComponentProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  props?: Record<string, any>;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyComponent Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mb-4 text-red-500">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Failed to load component</h3>
            <p className="text-gray-500">Please try refreshing the page</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function LazyComponent({
  component,
  fallback,
  className = '',
  errorBoundary = true,
  props = {}
}: LazyWrapperProps) {
  const LazyLoadedComponent = lazy(component);

  const defaultFallback = (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );

  const content = (
    <Suspense fallback={fallback || defaultFallback}>
      <LazyLoadedComponent {...props} />
    </Suspense>
  );

  if (errorBoundary) {
    return (
      <ErrorBoundary fallback={fallback}>
        {content}
      </ErrorBoundary>
    );
  }

  return content;
}

// Helper function to create lazy components
export function createLazyComponent<T extends Record<string, any> = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: LazyComponentProps = {}
) {
  return (props: T) => (
    <LazyComponent
      component={importFn}
      props={props}
      {...options}
    />
  );
}

// Pre-built lazy components for common use cases
export const LazyJobCard = createLazyComponent(
  () => import('@/components/JobCard'),
  { fallback: <div className="h-32 animate-pulse bg-gray-200 rounded-lg" /> }
);

export const LazyJobList = createLazyComponent(
  () => import('@/components/JobList'),
  { fallback: <div className="space-y-4">{Array(5).fill(0).map((_, i) => <div key={i} className="h-32 animate-pulse bg-gray-200 rounded-lg" />)}</div> }
);

export default LazyComponent;