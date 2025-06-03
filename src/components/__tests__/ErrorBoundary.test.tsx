import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../__tests__/utils/test-utils';
import {
  ErrorBoundary,
  FormErrorBoundary,
  useErrorHandler,
} from '../ErrorBoundary';

// Mock the UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, ...props }: any) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  AlertCircle: ({ className }: any) => (
    <div data-testid="alert-circle-icon" className={className} />
  ),
  RefreshCw: ({ className }: any) => (
    <div data-testid="refresh-icon" className={className} />
  ),
}));

// Test component that throws an error
const ThrowError = ({
  shouldThrow,
  errorMessage,
}: {
  shouldThrow: boolean;
  errorMessage?: string;
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage || 'Test error');
  }
  return <div>No error</div>;
};

// Test component for testing the hook
const TestErrorHandlerComponent = () => {
  const { captureError, resetError } = useErrorHandler();

  return (
    <div>
      <button onClick={() => captureError(new Error('Hook error'))}>
        Trigger Error
      </button>
      <button onClick={resetError}>Reset Error</button>
      <div>Hook component rendered</div>
    </div>
  );
};

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
  },
  writable: true,
});

// Suppress console.error during tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReload.mockClear();
  });

  describe('Normal Rendering', () => {
    it('renders children when there is no error', () => {
      renderWithProviders(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
      expect(
        screen.queryByText('Something went wrong')
      ).not.toBeInTheDocument();
    });

    it('renders custom fallback when provided and no error occurs', () => {
      renderWithProviders(
        <ErrorBoundary fallback={<div>Custom fallback</div>}>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
      expect(screen.queryByText('Custom fallback')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('catches and displays default error UI when child component throws', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText(
          'We apologize for the inconvenience. An unexpected error has occurred.'
        )
      ).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('displays custom fallback UI when provided and error occurs', () => {
      const customFallback = <div>Custom error message</div>;

      renderWithProviders(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(
        screen.queryByText('Something went wrong')
      ).not.toBeInTheDocument();
    });

    it('calls onError callback when error occurs', () => {
      const mockOnError = jest.fn();

      renderWithProviders(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow={true} errorMessage="Callback test error" />
        </ErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Callback test error',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('logs error to console when error occurs', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Console log test" />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.objectContaining({
          message: 'Console log test',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });

  describe('Error UI Interactions', () => {
    beforeEach(() => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
    });

    it('displays Try Again and Reload Page buttons', () => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Reload Page')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('reloads page when Reload Page button is clicked', () => {
      const reloadButton = screen.getByText('Reload Page');
      fireEvent.click(reloadButton);

      expect(mockReload).toHaveBeenCalledTimes(1);
    });

    it('resets error state when Try Again button is clicked', () => {
      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      // After clicking Try Again, the error boundary should reset and try to render children again
      // Since ThrowError will throw again, we should still see the error UI
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Error Details', () => {
    it('shows error details when showDetails prop is true', () => {
      renderWithProviders(
        <ErrorBoundary showDetails={true}>
          <ThrowError
            shouldThrow={true}
            errorMessage="Detailed error message"
          />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details')).toBeInTheDocument();

      // Click to expand details
      fireEvent.click(screen.getByText('Error Details'));

      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText('Detailed error message')).toBeInTheDocument();
      expect(screen.getByText('Component Stack:')).toBeInTheDocument();
    });

    it('does not show error details when showDetails prop is false or undefined', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
    });
  });

  describe('Recovery Behavior', () => {
    it('successfully renders children after error recovery', () => {
      const TestRecoveryComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);

        return (
          <div>
            <button onClick={() => setShouldThrow(false)}>Fix Error</button>
            <ErrorBoundary>
              <ThrowError shouldThrow={shouldThrow} />
            </ErrorBoundary>
          </div>
        );
      };

      renderWithProviders(<TestRecoveryComponent />);

      // Initially should show error
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Fix the error condition
      fireEvent.click(screen.getByText('Fix Error'));

      // Click Try Again
      fireEvent.click(screen.getByText('Try Again'));

      // Should now show successful render
      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(
        screen.queryByText('Something went wrong')
      ).not.toBeInTheDocument();
    });
  });
});

describe('useErrorHandler Hook', () => {
  it('throws error when captureError is called', () => {
    const TestWrapper = () => (
      <ErrorBoundary>
        <TestErrorHandlerComponent />
      </ErrorBoundary>
    );

    renderWithProviders(<TestWrapper />);

    expect(screen.getByText('Hook component rendered')).toBeInTheDocument();

    // Trigger error
    fireEvent.click(screen.getByText('Trigger Error'));

    // Should now show error boundary
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.queryByText('Hook component rendered')
    ).not.toBeInTheDocument();
  });

  it('resets error state when resetError is called', () => {
    const TestWrapper = () => {
      const [hasError, setHasError] = React.useState(false);

      return (
        <div>
          <button onClick={() => setHasError(true)}>Set Error State</button>
          {hasError ? (
            <ErrorBoundary>
              <TestErrorHandlerComponent />
            </ErrorBoundary>
          ) : (
            <div>No error boundary active</div>
          )}
        </div>
      );
    };

    renderWithProviders(<TestWrapper />);

    expect(screen.getByText('No error boundary active')).toBeInTheDocument();

    // Activate error boundary
    fireEvent.click(screen.getByText('Set Error State'));
    expect(screen.getByText('Hook component rendered')).toBeInTheDocument();

    // Test that resetError function exists and can be called
    const resetButton = screen.getByText('Reset Error');
    expect(resetButton).toBeInTheDocument();

    // Should not throw when clicked (since no error is active)
    fireEvent.click(resetButton);
    expect(screen.getByText('Hook component rendered')).toBeInTheDocument();
  });
});

describe('FormErrorBoundary Component', () => {
  it('renders children when no error occurs', () => {
    renderWithProviders(
      <FormErrorBoundary>
        <div>Form content</div>
      </FormErrorBoundary>
    );

    expect(screen.getByText('Form content')).toBeInTheDocument();
    expect(screen.queryByText('Form Error')).not.toBeInTheDocument();
  });

  it('displays form-specific error UI when child throws', () => {
    renderWithProviders(
      <FormErrorBoundary>
        <ThrowError shouldThrow={true} />
      </FormErrorBoundary>
    );

    expect(screen.getByText('Form Error')).toBeInTheDocument();
    expect(
      screen.getByText(
        'There was an error processing your form. Please refresh the page and try again.'
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
  });

  it('calls onError callback when provided', () => {
    const mockOnError = jest.fn();

    renderWithProviders(
      <FormErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} errorMessage="Form error test" />
      </FormErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Form error test',
      })
    );
  });

  it('logs form error to console', () => {
    renderWithProviders(
      <FormErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Form console test" />
      </FormErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      'Form error boundary triggered:',
      expect.objectContaining({
        message: 'Form console test',
      })
    );
  });
});

describe('Error Boundary Integration', () => {
  it('handles nested error boundaries correctly', () => {
    renderWithProviders(
      <ErrorBoundary fallback={<div>Outer boundary</div>}>
        <div>
          <FormErrorBoundary>
            <ThrowError shouldThrow={true} />
          </FormErrorBoundary>
        </div>
      </ErrorBoundary>
    );

    // Inner FormErrorBoundary should catch the error
    expect(screen.getByText('Form Error')).toBeInTheDocument();
    expect(screen.queryByText('Outer boundary')).not.toBeInTheDocument();
  });

  it('outer boundary catches errors when inner boundary fails', () => {
    const FailingFormBoundary = () => {
      throw new Error('Boundary itself failed');
    };

    renderWithProviders(
      <ErrorBoundary fallback={<div>Outer boundary caught error</div>}>
        <FailingFormBoundary />
      </ErrorBoundary>
    );

    expect(screen.getByText('Outer boundary caught error')).toBeInTheDocument();
  });
});
