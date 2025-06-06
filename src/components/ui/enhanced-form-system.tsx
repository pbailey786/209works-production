'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLoading, useToast } from '@/lib/ui/component-state-manager';

// Enhanced form validation types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  asyncValidator?: (value: any) => Promise<string | null>;
}

export interface FormFieldState {
  value: any;
  error: string | null;
  isValidating: boolean;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
}

export interface FormState {
  fields: Record<string, FormFieldState>;
  isSubmitting: boolean;
  isValid: boolean;
  submitCount: number;
  errors: Record<string, string>;
}

// Form context for state management
interface FormContextValue {
  state: FormState;
  updateField: (name: string, value: any) => void;
  validateField: (name: string) => Promise<void>;
  setFieldError: (name: string, error: string | null) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  submitForm: () => Promise<void>;
  resetForm: () => void;
  registerField: (name: string, rules: ValidationRule) => void;
  unregisterField: (name: string) => void;
}

const FormContext = React.createContext<FormContextValue | null>(null);

// Enhanced form provider with comprehensive state management
export function EnhancedFormProvider({
  children,
  onSubmit,
  initialValues = {},
  validationRules = {},
  validateOnChange = true,
  validateOnBlur = true,
}: {
  children: React.ReactNode;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  initialValues?: Record<string, any>;
  validationRules?: Record<string, ValidationRule>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}) {
  const { addLoading, removeLoading } = useLoading();
  const { addToast } = useToast();
  const validationRulesRef = React.useRef(validationRules);
  const asyncValidationTimeouts = React.useRef<Record<string, NodeJS.Timeout>>(
    {}
  );

  // Initialize form state
  const [state, setState] = React.useState<FormState>(() => {
    const fields: Record<string, FormFieldState> = {};

    Object.keys(initialValues).forEach(name => {
      fields[name] = {
        value: initialValues[name],
        error: null,
        isValidating: false,
        isValid: true,
        isDirty: false,
        isTouched: false,
      };
    });

    return {
      fields,
      isSubmitting: false,
      isValid: true,
      submitCount: 0,
      errors: {},
    };
  });

  // Validation function with debouncing for async validators
  const validateField = React.useCallback(
    async (name: string) => {
      const field = state.fields[name];
      const rules = validationRulesRef.current[name];

      if (!field || !rules) return;

      // Clear existing async validation timeout
      if (asyncValidationTimeouts.current[name]) {
        clearTimeout(asyncValidationTimeouts.current[name]);
      }

      setState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [name]: {
            ...prev.fields[name],
            isValidating: true,
            error: null,
          },
        },
      }));

      let error: string | null = null;

      try {
        // Required validation
        if (
          rules.required &&
          (!field.value || field.value.toString().trim() === '')
        ) {
          error = 'This field is required';
        }

        // Length validations
        if (!error && field.value && typeof field.value === 'string') {
          if (rules.minLength && field.value.length < rules.minLength) {
            error = `Minimum length is ${rules.minLength} characters`;
          }
          if (rules.maxLength && field.value.length > rules.maxLength) {
            error = `Maximum length is ${rules.maxLength} characters`;
          }
        }

        // Pattern validation
        if (
          !error &&
          field.value &&
          rules.pattern &&
          !rules.pattern.test(field.value.toString())
        ) {
          error = 'Invalid format';
        }

        // Custom validation
        if (!error && rules.custom) {
          error = rules.custom(field.value);
        }

        // Async validation with debouncing
        if (!error && rules.asyncValidator) {
          asyncValidationTimeouts.current[name] = setTimeout(async () => {
            try {
              const asyncError = await rules.asyncValidator!(field.value);
              setState(prev => ({
                ...prev,
                fields: {
                  ...prev.fields,
                  [name]: {
                    ...prev.fields[name],
                    error: asyncError,
                    isValid: !asyncError,
                    isValidating: false,
                  },
                },
              }));
            } catch (err) {
              console.error('Async validation error:', err);
              setState(prev => ({
                ...prev,
                fields: {
                  ...prev.fields,
                  [name]: {
                    ...prev.fields[name],
                    error: 'Validation failed',
                    isValid: false,
                    isValidating: false,
                  },
                },
              }));
            }
          }, 500); // 500ms debounce

          return; // Exit early for async validation
        }
      } catch (err) {
        console.error('Validation error:', err);
        error = 'Validation failed';
      }

      setState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [name]: {
            ...prev.fields[name],
            error,
            isValid: !error,
            isValidating: false,
          },
        },
      }));
    },
    [state.fields]
  );

  // Update field value
  const updateField = React.useCallback(
    (name: string, value: any) => {
      setState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [name]: {
            ...prev.fields[name],
            value,
            isDirty: true,
          },
        },
      }));

      if (validateOnChange) {
        validateField(name);
      }
    },
    [validateOnChange, validateField]
  );

  // Set field error manually
  const setFieldError = React.useCallback(
    (name: string, error: string | null) => {
      setState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [name]: {
            ...prev.fields[name],
            error,
            isValid: !error,
          },
        },
      }));
    },
    []
  );

  // Set field touched state
  const setFieldTouched = React.useCallback(
    (name: string, touched: boolean) => {
      setState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [name]: {
            ...prev.fields[name],
            isTouched: touched,
          },
        },
      }));

      if (touched && validateOnBlur) {
        validateField(name);
      }
    },
    [validateOnBlur, validateField]
  );

  // Submit form
  const submitForm = React.useCallback(async () => {
    setState(prev => ({
      ...prev,
      isSubmitting: true,
      submitCount: prev.submitCount + 1,
    }));

    const loadingId = addLoading({
      message: 'Submitting form...',
      type: 'action',
    });

    try {
      // Validate all fields
      const validationPromises = Object.keys(state.fields).map(name =>
        validateField(name)
      );
      await Promise.all(validationPromises);

      // Check if form is valid
      const hasErrors = Object.values(state.fields).some(field => field.error);

      if (hasErrors) {
        addToast({
          message: 'Please fix the errors before submitting',
          type: 'error',
          duration: 5000,
        });
        return;
      }

      // Extract values
      const values: Record<string, any> = {};
      Object.entries(state.fields).forEach(([name, field]) => {
        values[name] = field.value;
      });

      // Submit
      await onSubmit(values);

      addToast({
        message: 'Form submitted successfully',
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Form submission error:', error);
      addToast({
        message: error instanceof Error ? error.message : 'Submission failed',
        type: 'error',
        duration: 5000,
      });
    } finally {
      removeLoading(loadingId);
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [
    state.fields,
    validateField,
    onSubmit,
    addLoading,
    removeLoading,
    addToast,
  ]);

  // Reset form
  const resetForm = React.useCallback(() => {
    setState(prev => ({
      ...prev,
      fields: Object.fromEntries(
        Object.entries(prev.fields).map(([name, field]) => [
          name,
          {
            ...field,
            value: initialValues[name] || '',
            error: null,
            isValidating: false,
            isValid: true,
            isDirty: false,
            isTouched: false,
          },
        ])
      ),
      isSubmitting: false,
      submitCount: 0,
      errors: {},
    }));
  }, [initialValues]);

  // Register field
  const registerField = React.useCallback(
    (name: string, rules: ValidationRule) => {
      validationRulesRef.current[name] = rules;

      if (!state.fields[name]) {
        setState(prev => ({
          ...prev,
          fields: {
            ...prev.fields,
            [name]: {
              value: initialValues[name] || '',
              error: null,
              isValidating: false,
              isValid: true,
              isDirty: false,
              isTouched: false,
            },
          },
        }));
      }
    },
    [state.fields, initialValues]
  );

  // Unregister field
  const unregisterField = React.useCallback((name: string) => {
    delete validationRulesRef.current[name];

    if (asyncValidationTimeouts.current[name]) {
      clearTimeout(asyncValidationTimeouts.current[name]);
      delete asyncValidationTimeouts.current[name];
    }

    setState(prev => {
      const newFields = { ...prev.fields };
      delete newFields[name];
      return {
        ...prev,
        fields: newFields,
      };
    });
  }, []);

  // Update form validity
  React.useEffect(() => {
    const isValid = Object.values(state.fields).every(
      field => field.isValid && !field.isValidating
    );
    setState(prev => ({ ...prev, isValid }));
  }, [state.fields]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      Object.values(asyncValidationTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  const contextValue = React.useMemo(
    () => ({
      state,
      updateField,
      validateField,
      setFieldError,
      setFieldTouched,
      submitForm,
      resetForm,
      registerField,
      unregisterField,
    }),
    [
      state,
      updateField,
      validateField,
      setFieldError,
      setFieldTouched,
      submitForm,
      resetForm,
      registerField,
      unregisterField,
    ]
  );

  return (
    <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
  );
}

// Hook to use form context
export function useEnhancedForm() {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error(
      'useEnhancedForm must be used within an EnhancedFormProvider'
    );
  }
  return context;
}

// Enhanced form field component
export interface EnhancedFormFieldProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  description?: string;
  rules?: ValidationRule;
  className?: string;
  disabled?: boolean;
  autoComplete?: string;
  children?: (props: {
    field: FormFieldState;
    updateField: (value: any) => void;
    setTouched: (touched: boolean) => void;
  }) => React.ReactNode;
}

export function EnhancedFormField({
  name,
  label,
  type = 'text',
  placeholder,
  description,
  rules = {},
  className = '',
  disabled = false,
  autoComplete,
  children,
}: EnhancedFormFieldProps) {
  const {
    state,
    updateField,
    setFieldTouched,
    registerField,
    unregisterField,
  } = useEnhancedForm();
  const field = state.fields[name];

  // Register field on mount
  React.useEffect(() => {
    registerField(name, rules);
    return () => unregisterField(name);
  }, [name, rules, registerField, unregisterField]);

  if (!field) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    updateField(name, e.target.value);
  };

  const handleBlur = () => {
    setFieldTouched(name, true);
  };

  const setTouched = (touched: boolean) => {
    setFieldTouched(name, touched);
  };

  const updateFieldValue = (value: any) => {
    updateField(name, value);
  };

  // Custom render function
  if (children) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <label htmlFor={name} className="text-sm font-medium text-gray-700">
            {label}
            {rules.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        {children({ field, updateField: updateFieldValue, setTouched })}

        {description && !field.error && (
          <p className="text-sm text-gray-500">{description}</p>
        )}

        <AnimatePresence>
          {field.error && field.isTouched && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1 text-sm text-red-600"
            >
              <AlertCircle className="h-4 w-4" />
              {field.error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default input rendering
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {rules.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            id={name}
            value={field.value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled || field.isValidating}
            autoComplete={autoComplete}
            className={cn(
              'w-full rounded-md border px-3 py-2 shadow-sm',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
              'disabled:bg-gray-50 disabled:text-gray-500',
              field.error && field.isTouched
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300',
              field.isValid && field.isTouched && !field.error
                ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                : ''
            )}
            rows={4}
          />
        ) : (
          <input
            id={name}
            type={type}
            value={field.value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled || field.isValidating}
            autoComplete={autoComplete}
            className={cn(
              'w-full rounded-md border px-3 py-2 shadow-sm',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
              'disabled:bg-gray-50 disabled:text-gray-500',
              field.error && field.isTouched
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300',
              field.isValid && field.isTouched && !field.error
                ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                : ''
            )}
          />
        )}

        {/* Status icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {field.isValidating && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          )}
          {!field.isValidating && field.error && field.isTouched && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          {!field.isValidating &&
            field.isValid &&
            field.isTouched &&
            !field.error &&
            field.isDirty && <CheckCircle className="h-4 w-4 text-green-500" />}
        </div>
      </div>

      {description && !field.error && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      <AnimatePresence>
        {field.error && field.isTouched && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-1 text-sm text-red-600"
          >
            <AlertCircle className="h-4 w-4" />
            {field.error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Enhanced password field with strength indicator
export function EnhancedPasswordField({
  name,
  label = 'Password',
  showStrengthIndicator = true,
  rules = {},
  ...props
}: Omit<EnhancedFormFieldProps, 'type'> & {
  showStrengthIndicator?: boolean;
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const { state } = useEnhancedForm();
  const field = state.fields[name];

  const calculateStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    return score;
  };

  const strength = field?.value ? calculateStrength(field.value) : 0;

  const getStrengthColor = (score: number): string => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score: number): string => {
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <EnhancedFormField
      name={name}
      label={label}
      type={showPassword ? 'text' : 'password'}
      rules={rules}
      {...props}
    >
      {({ field, updateField, setTouched }) => (
        <div className="space-y-2">
          <div className="relative">
            <input
              id={name}
              type={showPassword ? 'text' : 'password'}
              value={field.value || ''}
              onChange={e => updateField(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={props.placeholder}
              disabled={props.disabled || field.isValidating}
              autoComplete="current-password"
              className={cn(
                'w-full rounded-md border px-3 py-2 pr-20 shadow-sm',
                'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                'disabled:bg-gray-50 disabled:text-gray-500',
                field.error && field.isTouched
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300',
                field.isValid && field.isTouched && !field.error
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                  : ''
              )}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>

            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {field.isValidating && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              )}
              {!field.isValidating && field.error && field.isTouched && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              {!field.isValidating &&
                field.isValid &&
                field.isTouched &&
                !field.error &&
                field.isDirty && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
            </div>
          </div>

          {showStrengthIndicator && field.value && (
            <div className="space-y-1">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <div
                    key={level}
                    className={cn(
                      'h-1 flex-1 rounded-full bg-gray-200',
                      strength >= level && getStrengthColor(strength)
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Password strength: {getStrengthText(strength)}
              </p>
            </div>
          )}
        </div>
      )}
    </EnhancedFormField>
  );
}

// Form submit button with loading state
export function EnhancedFormSubmit({
  children = 'Submit',
  className = '',
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
}) {
  const { state, submitForm } = useEnhancedForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
  };

  return (
    <button
      type="submit"
      onClick={handleSubmit}
      disabled={state.isSubmitting || !state.isValid || props.disabled}
      className={cn(
        'rounded-md px-4 py-2 font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary'
          ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
          : 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
        className
      )}
      {...props}
    >
      {state.isSubmitting ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Submitting...
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Performance optimized versions
export const EnhancedFormProviderMemo = React.memo(EnhancedFormProvider);
export const EnhancedFormFieldMemo = React.memo(EnhancedFormField);
export const EnhancedPasswordFieldMemo = React.memo(EnhancedPasswordField);
export const EnhancedFormSubmitMemo = React.memo(EnhancedFormSubmit);
