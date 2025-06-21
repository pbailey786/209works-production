'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyComponentProps {
  fallback?: React.ReactNode;
  className?: string;
}

// Generic lazy loading wrapper
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);

  return function WrappedLazyComponent(
    props: React.ComponentProps<T> & LazyComponentProps
  ) {
    const { fallback: customFallback, className, ...componentProps } = props;

    return (
      <Suspense
        fallback={
          customFallback ||
          fallback || <ComponentSkeleton className={className} />
        }
      >
        <LazyComponent {...(componentProps as any)} />
      </Suspense>
    );
  };
}

// Default skeleton fallback
function ComponentSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

// Intersection Observer based lazy loading
export function LazyOnVisible({
  children,
  fallback = <ComponentSkeleton />,
  rootMargin = '50px',
  threshold = 0.1,
  className,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, rootMargin, threshold]);

  return (
    <div ref={setRef} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

// Specific lazy components for common use cases
// LazyJobModal removed for production

export const LazyAdDisplay = createLazyComponent(
  () => import('@/components/ads/AdDisplay'),
  <div className="rounded-lg border p-4">
    <Skeleton className="mb-2 h-4 w-1/4" />
    <Skeleton className="mb-2 h-20 w-full" />
    <Skeleton className="h-4 w-1/3" />
  </div>
);

export const LazyChart = createLazyComponent(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  <div className="h-64 w-full">
    <Skeleton className="h-full w-full" />
  </div>
);

// Hook for dynamic imports
export function useDynamicImport<T>(
  importFn: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    importFn()
      .then(setComponent)
      .catch(setError)
      .finally(() => setLoading(false));
  }, deps);

  return { component, loading, error };
}
