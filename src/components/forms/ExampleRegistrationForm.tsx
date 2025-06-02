'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormInput, PasswordInput, FormTextarea, FileInput } from '@/components/ui/form-input';
import { FormErrorBoundary } from '@/components/ErrorBoundary';
import { 
  validationPatterns,
  handleFormSubmission,
  useFormDirtyState,
  useDebounceValidation
} from '@/lib/validations/form-utils';
import { useToast } from '@/hooks/use-toast';

// Example registration schema using our validation patterns
const registrationSchema = z.object({
  // Basic info
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: validationPatterns.email,
  password: validationPatterns.strongPassword,
  confirmPassword: z.string(),
  
  // Optional fields
  phone: validationPatterns.phone.optional(),
  linkedinUrl: validationPatterns.linkedinUrl,
  website: validationPatterns.url.optional(),
  
  // Text area
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  
  // File upload
  resume: z.instanceof(File).optional(),
  
  // Checkbox
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export function ExampleRegistrationForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      linkedinUrl: '',
      website: '',
      bio: '',
      acceptTerms: false,
    },
    mode: 'onChange', // Validate on change for immediate feedback
  });

  const isDirty = useFormDirtyState(form);
  const debouncedValidate = useDebounceValidation(form, 300);

  // Handle email validation with debouncing
  const handleEmailChange = (value: string) => {
    form.setValue('email', value);
    debouncedValidate('email');
  };

  const onSubmit = async (data: RegistrationFormData) => {
    const result = await handleFormSubmission(
      async () => {
        setIsSubmitting(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate random success/failure for demo
        if (Math.random() > 0.5) {
          throw new Error('Registration failed: Email already exists');
        }
        
        return { success: true, userId: '123' };
      },
      {
        onSuccess: (data) => {
          toast({
            title: "Success!",
            description: "Your account has been created successfully.",
            variant: "default",
          });
          form.reset();
        },
        onError: (errors) => {
          // Handle form-specific errors
          errors.forEach((error) => {
            if (error.field === 'email') {
              form.setError('email', { 
                type: 'server', 
                message: error.message 
              });
            } else {
              toast({
                title: "Registration Failed",
                description: error.message,
                variant: "destructive",
              });
            }
          });
        },
      }
    );
    
    setIsSubmitting(false);
  };

  // Warn user about unsaved changes
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <FormErrorBoundary>
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
          <p className="text-gray-600">Join our platform to find your dream job</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormInput
                      label="First Name"
                      placeholder="Enter your first name"
                      required
                      error={form.formState.errors.firstName?.message}
                      isValidating={form.formState.isValidating}
                      {...field}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormInput
                      label="Last Name"
                      placeholder="Enter your last name"
                      required
                      error={form.formState.errors.lastName?.message}
                      isValidating={form.formState.isValidating}
                      {...field}
                    />
                  </FormItem>
                )}
              />
            </div>

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormInput
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email address"
                    required
                    description="We'll use this to send you job alerts and important updates"
                    error={form.formState.errors.email?.message}
                    isValidating={form.formState.isValidating}
                    {...field}
                    onChange={(e) => handleEmailChange(e.target.value)}
                  />
                </FormItem>
              )}
            />

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <PasswordInput
                      label="Password"
                      placeholder="Create a strong password"
                      required
                      showStrengthIndicator
                      error={form.formState.errors.password?.message}
                      {...field}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <PasswordInput
                      label="Confirm Password"
                      placeholder="Confirm your password"
                      required
                      error={form.formState.errors.confirmPassword?.message}
                      {...field}
                    />
                  </FormItem>
                )}
              />
            </div>

            {/* Optional Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormInput
                      label="Phone Number"
                      type="tel"
                      placeholder="(555) 123-4567"
                      description="Optional - for recruiter contact"
                      error={form.formState.errors.phone?.message}
                      {...field}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormInput
                      label="LinkedIn Profile"
                      placeholder="https://linkedin.com/in/yourprofile"
                      description="Optional - helps recruiters find you"
                      error={form.formState.errors.linkedinUrl?.message}
                      {...field}
                    />
                  </FormItem>
                )}
              />
            </div>

            {/* Website */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormInput
                    label="Personal Website"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    description="Optional - showcase your work"
                    error={form.formState.errors.website?.message}
                    {...field}
                  />
                </FormItem>
              )}
            />

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormTextarea
                    label="Professional Bio"
                    placeholder="Tell us about yourself, your skills, and career goals..."
                    description="Optional - helps recruiters understand your background"
                    showCharCount
                    maxLength={500}
                    rows={4}
                    error={form.formState.errors.bio?.message}
                    {...field}
                  />
                </FormItem>
              )}
            />

            {/* Resume Upload */}
            <FormField
              control={form.control}
              name="resume"
              render={({ field: { onChange, onBlur, name, ref } }) => (
                <FormItem>
                  <FileInput
                    onBlur={onBlur}
                    name={name}
                    ref={ref}
                    label="Resume"
                    description="Upload your resume (PDF, DOC, or DOCX)"
                    acceptedFileTypes={['.pdf', '.doc', '.docx']}
                    maxFileSize={5}
                    error={form.formState.errors.resume?.message}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      onChange(file);
                    }}
                  />
                </FormItem>
              )}
            />

            {/* Terms Checkbox */}
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium">
                      I accept the{' '}
                      <a href="/terms" className="text-blue-600 hover:underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isSubmitting || !form.formState.isValid}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </Form>

        {/* Development Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded text-sm">
            <p className="font-semibold mb-2">Development Info:</p>
            <p>Form Valid: {form.formState.isValid ? '✅' : '❌'}</p>
            <p>Has Changes: {isDirty ? '✅' : '❌'}</p>
            <p>Is Validating: {form.formState.isValidating ? '✅' : '❌'}</p>
          </div>
        )}
      </div>
    </FormErrorBoundary>
  );
} 