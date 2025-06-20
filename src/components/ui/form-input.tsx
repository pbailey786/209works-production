import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from '@/components/ui/card';
import { cn } from '@/components/ui/card';
import { Input } from '@/components/ui/card';
import { Label } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';


export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  description?: string;
  isLoading?: boolean;
  isValidating?: boolean;
  showValidationIcon?: boolean;
  containerClassName?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      className,
      type,
      label,
      error,
      success,
      description,
      isLoading,
      isValidating,
      showValidationIcon = true,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;
    const showIcon = showValidationIcon && !isLoading && !isValidating;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <Label
            htmlFor={props.id}
            className={cn(
              'text-sm font-medium',
              hasError && 'text-destructive',
              hasSuccess && 'text-green-600'
            )}
          >
            {label}
            {props.required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}

        <div className="relative">
          <Input
            type={type}
            className={cn(
              'pr-10',
              hasError && 'border-destructive focus-visible:ring-destructive',
              hasSuccess && 'border-green-500 focus-visible:ring-green-500',
              (isLoading || isValidating) && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />

          {/* Loading/Validation/Status Icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {isValidating && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            )}
            {showIcon && hasError && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            {showIcon && hasSuccess && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>

        {/* Description */}
        {description && !error && !success && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {/* Error Message */}
        {error && (
          <p className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}

        {/* Success Message */}
        {success && !error && (
          <p className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="h-3 w-3" />
            {success}
          </p>
        )}
      </div>
    );
  }
);
FormInput.displayName = 'FormInput';

export interface PasswordInputProps extends Omit<FormInputProps, 'type'> {
  showStrengthIndicator?: boolean;
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(({ showStrengthIndicator = false, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [strength, setStrength] = React.useState(0);

  const calculatePasswordStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    return score;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    if (showStrengthIndicator) {
      setStrength(calculatePasswordStrength(password));
    }
    props.onChange?.(e);
  };

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
    <div className="space-y-2">
      <div className="relative">
        <FormInput
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          {...props}
          onChange={handlePasswordChange}
          className={cn('pr-20', props.className)}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {showStrengthIndicator && props.value && (
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
          <p className="text-xs text-muted-foreground">
            Password strength: {getStrengthText(strength)}
          </p>
        </div>
      )}
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  description?: string;
  showCharCount?: boolean;
  maxLength?: number;
  containerClassName?: string;
}

export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  FormTextareaProps
>(
  (
    {
      className,
      label,
      error,
      success,
      description,
      showCharCount = false,
      maxLength,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;
    const currentLength = String(props.value || '').length;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <Label
            htmlFor={props.id}
            className={cn(
              'text-sm font-medium',
              hasError && 'text-destructive',
              hasSuccess && 'text-green-600'
            )}
          >
            {label}
            {props.required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}

        <Textarea
          className={cn(
            hasError && 'border-destructive focus-visible:ring-destructive',
            hasSuccess && 'border-green-500 focus-visible:ring-green-500',
            className
          )}
          maxLength={maxLength}
          ref={ref}
          {...props}
        />

        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Description */}
            {description && !error && !success && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}

            {/* Error Message */}
            {error && (
              <p className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}

            {/* Success Message */}
            {success && !error && (
              <p className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-3 w-3" />
                {success}
              </p>
            )}
          </div>

          {/* Character Count */}
          {showCharCount && (
            <p
              className={cn(
                'text-xs text-muted-foreground',
                maxLength &&
                  currentLength > maxLength * 0.9 &&
                  'text-yellow-600',
                maxLength && currentLength >= maxLength && 'text-destructive'
              )}
            >
              {currentLength}
              {maxLength && `/${maxLength}`}
            </p>
          )}
        </div>
      </div>
    );
  }
);
FormTextarea.displayName = 'FormTextarea';

export interface FileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  success?: string;
  description?: string;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
  showPreview?: boolean;
  containerClassName?: string;
}

export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      label,
      error,
      success,
      description,
      acceptedFileTypes,
      maxFileSize,
      showPreview = false,
      containerClassName,
      onChange,
      ...props
    },
    ref
  ) => {
    const [preview, setPreview] = React.useState<string | null>(null);
    const [fileName, setFileName] = React.useState<string>('');
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (file) {
        setFileName(file.name);

        if (showPreview && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          setPreview(null);
        }
      } else {
        setFileName('');
        setPreview(null);
      }

      onChange?.(e);
    };

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <Label
            htmlFor={props.id}
            className={cn(
              'text-sm font-medium',
              hasError && 'text-destructive',
              hasSuccess && 'text-green-600'
            )}
          >
            {label}
            {props.required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}

        <Input
          type="file"
          className={cn(
            hasError && 'border-destructive focus-visible:ring-destructive',
            hasSuccess && 'border-green-500 focus-visible:ring-green-500',
            className
          )}
          accept={acceptedFileTypes?.join(',')}
          onChange={handleFileChange}
          ref={ref}
          {...props}
        />

        {/* File Info */}
        {fileName && (
          <p className="text-sm text-muted-foreground">Selected: {fileName}</p>
        )}

        {/* File Preview */}
        {showPreview && preview && (
          <div className="mt-2">
            <img
              src={preview}
              alt="Preview"
              className="max-h-32 max-w-32 rounded border object-cover"
            />
          </div>
        )}

        {/* Description */}
        {description && !error && !success && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {/* File Requirements */}
        {(acceptedFileTypes || maxFileSize) && !error && !success && (
          <div className="space-y-1 text-xs text-muted-foreground">
            {acceptedFileTypes && (
              <p>Accepted formats: {acceptedFileTypes.join(', ')}</p>
            )}
            {maxFileSize && <p>Maximum file size: {maxFileSize}MB</p>}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}

        {/* Success Message */}
        {success && !error && (
          <p className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="h-3 w-3" />
            {success}
          </p>
        )}
      </div>
    );
  }
);
FileInput.displayName = 'FileInput';
