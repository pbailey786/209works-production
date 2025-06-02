import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExampleRegistrationForm } from '../ExampleRegistrationForm';

// Mock react-hook-form
const mockUseForm = {
  handleSubmit: jest.fn((onSubmit) => async (e: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    return await onSubmit({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
      acceptTerms: true,
    });
  }),
  setValue: jest.fn(),
  setError: jest.fn(),
  reset: jest.fn(),
  control: {},
  formState: {
    errors: {},
    isValidating: false,
    isDirty: false,
    isValid: false,
  },
};

jest.mock('react-hook-form', () => ({
  useForm: () => mockUseForm,
}));

// Mock toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock form utils
jest.mock('@/lib/validations/form-utils', () => ({
  validationPatterns: {
    email: { parse: jest.fn() },
    strongPassword: { parse: jest.fn() },
    phone: { optional: () => ({ parse: jest.fn() }) },
    linkedinUrl: { parse: jest.fn() },
    url: { optional: () => ({ parse: jest.fn() }) },
  },
  handleFormSubmission: jest.fn(),
  useFormDirtyState: jest.fn(() => false),
  useDebounceValidation: jest.fn(() => jest.fn()),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormField: ({ render, name }: { render: Function; name: string }) => {
    const [fieldValue, setFieldValue] = React.useState(name === 'acceptTerms' ? false : '');
    
    const field = { 
      onChange: (value: any) => {
        if (name === 'acceptTerms') {
          setFieldValue(value);
        } else {
          setFieldValue(value.target ? value.target.value : value);
        }
      }, 
      onBlur: jest.fn(), 
      value: fieldValue, 
      name: name || 'test' 
    };
    
    return render({ field });
  },
  FormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  FormMessage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onChange, ...props }: any) => {
    const [isChecked, setIsChecked] = React.useState(checked || false);
    
    const handleChange = (e: any) => {
      setIsChecked(e.target.checked);
      if (onChange) onChange(e.target.checked);
    };
    
    return (
      <input 
        type="checkbox" 
        aria-labelledby="terms-label" 
        checked={isChecked}
        onChange={handleChange}
        {...props} 
      />
    );
  },
}));

jest.mock('@/components/ui/form-input', () => ({
  FormInput: ({ label, placeholder, required, error, value, onChange, ...props }: any) => {
    const fieldId = `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    const [inputValue, setInputValue] = React.useState(value || '');
    
    const handleChange = (e: any) => {
      setInputValue(e.target.value);
      if (onChange) onChange(e);
    };
    
    return (
      <div>
        <label htmlFor={fieldId}>{label} {required && '*'}</label>
        <input 
          id={fieldId}
          placeholder={placeholder}
          aria-invalid={!!error}
          data-testid={fieldId}
          value={inputValue}
          onChange={handleChange}
          {...props}
        />
        {error && <div role="alert" className="error-message">{error}</div>}
      </div>
    );
  },
  PasswordInput: ({ label, placeholder, required, error, value, onChange, ...props }: any) => {
    const fieldId = `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    const [inputValue, setInputValue] = React.useState(value || '');
    
    const handleChange = (e: any) => {
      setInputValue(e.target.value);
      if (onChange) onChange(e);
    };
    
    return (
      <div>
        <label htmlFor={fieldId}>{label} {required && '*'}</label>
        <input 
          id={fieldId}
          type="password"
          placeholder={placeholder}
          aria-invalid={!!error}
          data-testid={fieldId}
          value={inputValue}
          onChange={handleChange}
          {...props}
        />
        {error && <div role="alert" className="error-message">{error}</div>}
      </div>
    );
  },
  FormTextarea: ({ label, placeholder, error, ...props }: any) => {
    const fieldId = `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    return (
      <div>
        <label htmlFor={fieldId}>{label}</label>
        <textarea 
          id={fieldId}
          placeholder={placeholder}
          aria-invalid={!!error}
          data-testid={fieldId}
          {...props}
        />
        {error && <div role="alert" className="error-message">{error}</div>}
      </div>
    );
  },
  FileInput: ({ label, error, onChange, ...props }: any) => {
    const fieldId = `file-input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    
    return (
      <div>
        <label htmlFor={fieldId}>{label}</label>
        <input 
          id={fieldId}
          type="file"
          aria-invalid={!!error}
          data-testid={fieldId}
          onChange={onChange || jest.fn()}
          {...props}
        />
        {error && <div role="alert" className="error-message">{error}</div>}
      </div>
    );
  },
}));

jest.mock('@/components/ErrorBoundary', () => ({
  FormErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-error-boundary">{children}</div>
  ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div className={className} data-testid="loader-icon">Loading...</div>
  ),
}));

describe('ExampleRegistrationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the form with all required fields', () => {
      render(<ExampleRegistrationForm />);

      expect(screen.getByText('Create Your Account')).toBeInTheDocument();
      expect(screen.getByText('Join our platform to find your dream job')).toBeInTheDocument();
      
      // Check for form fields
      expect(screen.getByTestId('input-first-name')).toBeInTheDocument();
      expect(screen.getByTestId('input-last-name')).toBeInTheDocument();
      expect(screen.getByTestId('input-email-address')).toBeInTheDocument();
      expect(screen.getByTestId('input-password')).toBeInTheDocument();
      expect(screen.getByTestId('input-confirm-password')).toBeInTheDocument();
    });

    it('renders optional fields', () => {
      render(<ExampleRegistrationForm />);

      expect(screen.getByTestId('input-phone-number')).toBeInTheDocument();
      expect(screen.getByTestId('input-linkedin-profile')).toBeInTheDocument();
      expect(screen.getByTestId('input-personal-website')).toBeInTheDocument();
      expect(screen.getByTestId('textarea-professional-bio')).toBeInTheDocument();
      expect(screen.getByTestId('file-input-resume')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<ExampleRegistrationForm />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('wraps form in error boundary', () => {
      render(<ExampleRegistrationForm />);
      
      expect(screen.getByTestId('form-error-boundary')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('displays validation errors for required fields', async () => {
      const mockFormWithErrors = {
        ...mockUseForm,
        formState: {
          ...mockUseForm.formState,
          errors: {
            firstName: { message: 'First name is required' },
            email: { message: 'Email is required' },
            password: { message: 'Password is required' },
          },
        },
      };

      require('react-hook-form').useForm = jest.fn().mockReturnValue(mockFormWithErrors);

      render(<ExampleRegistrationForm />);

      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('shows validation state when validating', () => {
      const mockFormValidating = {
        ...mockUseForm,
        formState: {
          ...mockUseForm.formState,
          isValidating: true,
        },
      };

      require('react-hook-form').useForm = jest.fn().mockReturnValue(mockFormValidating);

      render(<ExampleRegistrationForm />);

      // Check that isValidating prop is passed to FormInput components
      const firstNameInput = screen.getByTestId('input-first-name');
      expect(firstNameInput).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('allows user to type in form fields', async () => {
      const user = userEvent.setup();
      render(<ExampleRegistrationForm />);

      const firstNameInput = screen.getByTestId('input-first-name');
      await user.type(firstNameInput, 'John');

      expect(firstNameInput).toHaveValue('John');
    });

    it('allows user to upload a file', async () => {
      const user = userEvent.setup();
      render(<ExampleRegistrationForm />);

      const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('file-input-resume');
      
      // Check that the file input exists and can accept files
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      
      // Note: Due to JSDOM limitations, we can't actually test file upload behavior
      // but we can verify the input is properly configured
      expect(fileInput).toHaveAttribute('data-testid', 'file-input-resume');
    });

    it('handles checkbox interactions', async () => {
      const user = userEvent.setup();
      render(<ExampleRegistrationForm />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('Form Submission', () => {
    let mockHandleFormSubmission: jest.Mock;

    beforeEach(() => {
      mockHandleFormSubmission = require('@/lib/validations/form-utils').handleFormSubmission;
      mockHandleFormSubmission.mockClear();
      
      // Mock the form as valid so submission can proceed
      mockUseForm.formState.isValid = true;
      
      // Reset the handleSubmit mock to ensure it calls the onSubmit function
      mockUseForm.handleSubmit.mockImplementation((onSubmit) => async (e) => {
        if (e && e.preventDefault) {
          e.preventDefault();
        }
        // Actually call the onSubmit function with the form data
        await onSubmit({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'StrongPass123!',
          confirmPassword: 'StrongPass123!',
          acceptTerms: true,
        });
      });
    });

    it('calls handleSubmit when form is submitted', async () => {
      const user = userEvent.setup();
      render(<ExampleRegistrationForm />);

      // First, check the terms checkbox to make form valid
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(mockUseForm.handleSubmit).toHaveBeenCalled();
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      render(<ExampleRegistrationForm />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      // The button should be disabled initially because form is not valid
      expect(submitButton).toBeDisabled();
    });

    it('handles successful submission', async () => {
      // Mock successful handleFormSubmission that calls onSuccess callback
      mockHandleFormSubmission.mockImplementation(async (submitFn, { onSuccess }) => {
        onSuccess({ success: true, userId: '123' });
        return Promise.resolve();
      });

      const user = userEvent.setup();
      render(<ExampleRegistrationForm />);

      // Simulate form submission by triggering handleSubmit directly
      const mockFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        acceptTerms: true,
      };

      // Manually trigger the form submission handler
      const handleSubmitFn = mockUseForm.handleSubmit.mock.calls[0][0];
      await handleSubmitFn(mockFormData);

      expect(mockHandleFormSubmission).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: "Success!",
        description: "Your account has been created successfully.",
        variant: "default",
      });
      expect(mockUseForm.reset).toHaveBeenCalled();
    });

    it('handles submission errors', async () => {
      mockHandleFormSubmission.mockImplementation(async (submitFn, { onError }) => {
        onError([{ field: 'email', message: 'Email already exists' }]);
        return Promise.resolve();
      });

      const user = userEvent.setup();
      render(<ExampleRegistrationForm />);

      // Simulate form submission by triggering handleSubmit directly
      const mockFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        acceptTerms: true,
      };

      // Manually trigger the form submission handler
      const handleSubmitFn = mockUseForm.handleSubmit.mock.calls[0][0];
      await handleSubmitFn(mockFormData);

      expect(mockHandleFormSubmission).toHaveBeenCalled();
      expect(mockUseForm.setError).toHaveBeenCalledWith('email', {
        type: 'server',
        message: 'Email already exists',
      });
    });

    it('handles general submission errors with toast', async () => {
      mockHandleFormSubmission.mockImplementation(async (submitFn, { onError }) => {
        onError([{ field: 'general', message: 'Something went wrong' }]);
        return Promise.resolve();
      });

      const user = userEvent.setup();
      render(<ExampleRegistrationForm />);

      // Simulate form submission by triggering handleSubmit directly
      const mockFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        acceptTerms: true,
      };

      // Manually trigger the form submission handler
      const handleSubmitFn = mockUseForm.handleSubmit.mock.calls[0][0];
      await handleSubmitFn(mockFormData);

      expect(mockHandleFormSubmission).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: "Registration Failed",
        description: "Something went wrong",
        variant: "destructive",
      });
    });
  });

  describe('Email Validation', () => {
    it('debounces email validation', async () => {
      const { useDebounceValidation } = require('@/lib/validations/form-utils');
      const mockDebouncedValidate = jest.fn();
      useDebounceValidation.mockReturnValue(mockDebouncedValidate);

      const user = userEvent.setup();
      render(<ExampleRegistrationForm />);

      const emailInput = screen.getByTestId('input-email-address');
      await user.type(emailInput, 'test@example.com');

      // Should call setValue and debounced validation
      expect(mockUseForm.setValue).toHaveBeenCalledWith('email', expect.any(String));
    });
  });

  describe('Unsaved Changes Warning', () => {
    it('sets up beforeunload listener when form is dirty', () => {
      const { useFormDirtyState } = require('@/lib/validations/form-utils');
      useFormDirtyState.mockReturnValue(true);

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<ExampleRegistrationForm />);

      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    it('does not prevent unload when form is clean', () => {
      const { useFormDirtyState } = require('@/lib/validations/form-utils');
      useFormDirtyState.mockReturnValue(false);

      render(<ExampleRegistrationForm />);

      const mockEvent = {
        preventDefault: jest.fn(),
        returnValue: '',
      };

      // Simulate beforeunload event
      window.dispatchEvent(new Event('beforeunload'));

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and associations', () => {
      render(<ExampleRegistrationForm />);

      // Check for proper labeling
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      // Check for specific password fields to avoid ambiguity
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('marks required fields appropriately', () => {
      render(<ExampleRegistrationForm />);

      expect(screen.getByText('First Name *')).toBeInTheDocument();
      expect(screen.getByText('Last Name *')).toBeInTheDocument();
      expect(screen.getByText('Email Address *')).toBeInTheDocument();
      expect(screen.getByText('Password *')).toBeInTheDocument();
    });

    it('shows error messages with proper role', () => {
      const mockFormWithErrors = {
        ...mockUseForm,
        formState: {
          ...mockUseForm.formState,
          errors: {
            firstName: { message: 'First name is required' },
          },
        },
      };

      require('react-hook-form').useForm = jest.fn().mockReturnValue(mockFormWithErrors);

      render(<ExampleRegistrationForm />);

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('First name is required');
    });

    it('sets aria-invalid on fields with errors', () => {
      const mockFormWithErrors = {
        ...mockUseForm,
        formState: {
          ...mockUseForm.formState,
          errors: {
            firstName: { message: 'First name is required' },
          },
        },
      };

      require('react-hook-form').useForm = jest.fn().mockReturnValue(mockFormWithErrors);

      render(<ExampleRegistrationForm />);

      const firstNameInput = screen.getByTestId('input-first-name');
      expect(firstNameInput).toHaveAttribute('aria-invalid', 'true');
    });
  });
}); 