import React, { Component, ErrorInfo, ReactNode } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

'use client';


interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log error to monitoring service (e.g., Sentry, LogRocket, etc.)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-md">
            <div className="mb-4 flex justify-center">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>

            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Something went wrong
            </h1>

            <p className="mb-6 text-gray-600">
              We apologize for the inconvenience. An unexpected error has
              occurred.
            </p>

            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>

              <Button
                onClick={this.handleReload}
                variant="outline"
                className="w-full"
              >
                Reload Page
              </Button>
            </div>

            {this.props.showDetails && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Error Details
                </summary>
                <div className="mt-2 max-h-40 overflow-auto rounded bg-gray-100 p-3 font-mono text-xs text-gray-800">
                  <p className="font-semibold">Error:</p>
                  <p className="mb-2">{this.state.error.message}</p>

                  {this.state.errorInfo && (
                    <>
                      <p className="font-semibold">Component Stack:</p>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for function components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

// Specialized error boundary for form errors
export function FormErrorBoundary({
  children,
  onError,
}: {
  children: ReactNode;
  onError?: (error: Error) => void;
}) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Form error boundary triggered:', error);
        if (onError) {
          onError(error);
        }
      }}
      fallback={
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
            <h3 className="text-sm font-medium text-red-800">Form Error</h3>
          </div>
          <p className="mt-1 text-sm text-red-700">
            There was an error processing your form. Please refresh the page and
            try again.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
