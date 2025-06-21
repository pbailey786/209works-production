import { UseFormReturn, FieldPath, FieldValues } from '@/components/ui/card';
import { z } from 'zod';
import { useRef } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import path from "path";


/**
 * Form validation utilities and error handling helpers
 */

// Common validation patterns
export const validationPatterns = {
  // Password validation with strength requirements
  strongPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^a-zA-Z0-9]/,
      'Password must contain at least one special character'
    ),

  // Email validation with additional checks
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(254, 'Email must be less than 254 characters')
    .toLowerCase(),

  // Phone number validation for US/International
  phone: z
    .string()
    .regex(
      /^(\+1\s?)?(\([0-9]{3}\)|[0-9]{3})[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}$/,
      'Please enter a valid phone number (e.g., (555) 123-4567)'
    ),

  // URL validation with protocol requirement
  url: z
    .string()
    .url('Please enter a valid URL (including http:// or https://)')
    .regex(/^https?:\/\//, 'URL must start with http:// or https://'),

  // File validation helpers
  fileSize: (maxSizeInMB: number) =>
    z
      .instanceof(File)
      .refine(
        file => file.size <= maxSizeInMB * 1024 * 1024,
        `File size must be less than ${maxSizeInMB}MB`
      ),

  fileType: (allowedTypes: string[]) =>
    z
      .instanceof(File)
      .refine(
        file => allowedTypes.includes(file.type),
        `File type must be one of: ${allowedTypes.path.join(', ')}`
      ),

  // LinkedIn URL validation
  linkedinUrl: z
    .string()
    .regex(
      /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/,
      'Please enter a valid LinkedIn profile URL'
    )
    .optional(),

  // Salary range validation
  salaryRange: z
    .object({
      min: z.coerce
        .number()
        .min(0, 'Minimum salary must be positive')
        .optional(),
      max: z.coerce
        .number()
        .min(0, 'Maximum salary must be positive')
        .optional(),
    })
    .refine(
      data => {
        if (data.min && data.max) {
          return data.min <= data.max;
        }
        return true;
      },
      {
        message: 'Minimum salary cannot be greater than maximum salary',
        path: ['min'],
      }
    ),
};

// Form error types
export interface FormError {
  field: string;
  message: string;
  type: 'validation' | 'server' | 'network';
}

export interface FormSubmissionState {
  isSubmitting: boolean;
  errors: FormError[];
  isSuccess: boolean;
  message?: string;
}

// Form submission wrapper with error handling
export async function handleFormSubmission<T>(
  submission: () => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: FormError[]) => void;
    successMessage?: string;
    showToast?: boolean;
  } = {}
): Promise<{ success: boolean; data?: T; errors?: FormError[] }> {
  try {
    const data = await submission();

    if (options.onSuccess) {
      options.onSuccess(data);
    }

    return { success: true, data };
  } catch (error) {
    const formErrors = parseErrorToFormErrors(error);

    if (options.onError) {
      options.onError(formErrors);
    }

    return { success: false, errors: formErrors };
  }
}

// Convert various error types to FormError[]
export function parseErrorToFormErrors(error: unknown): FormError[] {
  if (error instanceof z.ZodError) {
    return error.errors.map(err => ({
      field: err.path.path.join('.'),
      message: err.message,
      type: 'validation' as const,
    }));
  }

  if (error instanceof Error) {
    // Check for API errors with field-specific messages
    if (error.message.includes('validation')) {
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.errors && Array.isArray(parsed.errors)) {
          return parsed.errors.map((err: any) => ({
            field: err.field || 'general',
            message: err.message || 'Validation error',
            type: 'server' as const,
          }));
        }
      } catch {
        // Fall through to generic error handling
      }
    }

    return [
      {
        field: 'general',
        message: error.message,
        type: error.name === 'NetworkError' ? 'network' : 'server',
      },
    ];
  }

  return [
    {
      field: 'general',
      message: 'An unexpected error occurred',
      type: 'server' as const,
    },
  ];
}

// Form field validation helper
export function validateField<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldName: FieldPath<T>,
  value: any
): Promise<boolean> {
  return new Promise(resolve => {
    form.trigger(fieldName).then(isValid => {
      resolve(isValid);
    });
  });
}

// Debounced validation helper
export function useDebounceValidation<T extends FieldValues>(
  form: UseFormReturn<T>,
  delay: number = 500
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedValidate = useCallback(
    (fieldName: FieldPath<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        form.trigger(fieldName);
      }, delay);
    },
    [form, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedValidate;
}

// Form reset with default values
export function resetFormWithDefaults<T extends FieldValues>(
  form: UseFormReturn<T>,
  defaultValues: Partial<T>
) {
  form.reset(defaultValues as T);
  form.clearErrors();
}

// Check if form has unsaved changes
export function useFormDirtyState<T extends FieldValues>(
  form: UseFormReturn<T>
): boolean {
  const { formState } = form;
  return Object.keys(formState.dirtyFields).length > 0;
}
