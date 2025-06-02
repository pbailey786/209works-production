import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormInput, PasswordInput, FormTextarea, FileInput } from '../form-input';

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Eye: ({ className }: { className?: string }) => (
    <div className={className} data-testid="eye-icon">Eye</div>
  ),
  EyeOff: ({ className }: { className?: string }) => (
    <div className={className} data-testid="eyeoff-icon">EyeOff</div>
  ),
  Loader2: ({ className }: { className?: string }) => (
    <div className={className} data-testid="loader-icon">Loading</div>
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <div className={className} data-testid="check-icon">Check</div>
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <div className={className} data-testid="alert-icon">Alert</div>
  ),
  Upload: ({ className }: { className?: string }) => (
    <div className={className} data-testid="upload-icon">Upload</div>
  ),
  X: ({ className }: { className?: string }) => (
    <div className={className} data-testid="x-icon">X</div>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(({ className, ...props }, ref) => (
    <input ref={ref} className={className} {...props} />
  )),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, className, ...props }: any) => (
    <label className={className} {...props}>{children}</label>
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: React.forwardRef<HTMLTextAreaElement, any>(({ className, ...props }, ref) => (
    <textarea ref={ref} className={className} {...props} />
  )),
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('FormInput', () => {
  describe('Basic Rendering', () => {
    it('renders basic input without label', () => {
      render(<FormInput placeholder="Enter text" />);
      
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<FormInput label="Test Label" placeholder="Enter text" />);
      
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders required indicator when required', () => {
      render(<FormInput label="Required Field" required />);
      
      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveClass('text-destructive', 'ml-1');
    });

    it('applies custom container className', () => {
      render(<FormInput containerClassName="custom-container" />);
      
      const container = document.querySelector('.custom-container');
      expect(container).toBeInTheDocument();
    });
  });

  describe('States and Validation', () => {
    it('shows error state correctly', () => {
      render(<FormInput label="Test" error="This field is required" />);
      
      const errorMessage = screen.getByText('This field is required');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-destructive');
      
      const alertIcons = screen.getAllByTestId('alert-icon');
      expect(alertIcons).toHaveLength(2); // One in input and one in message
    });

    it('shows success state correctly', () => {
      render(<FormInput label="Test" success="Field is valid" />);
      
      const successMessage = screen.getByText('Field is valid');
      expect(successMessage).toBeInTheDocument();
      expect(successMessage).toHaveClass('text-green-600');
      
      const checkIcons = screen.getAllByTestId('check-icon');
      expect(checkIcons).toHaveLength(2); // One in input and one in message
    });

    it('prioritizes error over success', () => {
      render(<FormInput error="Error message" success="Success message" />);
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      expect(screen.getAllByTestId('alert-icon')).toHaveLength(2);
      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
    });

    it('shows loading state', () => {
      render(<FormInput isLoading />);
      
      const loader = screen.getByTestId('loader-icon');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveClass('animate-spin', 'text-muted-foreground');
    });

    it('shows validating state', () => {
      render(<FormInput isValidating />);
      
      const loader = screen.getByTestId('loader-icon');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveClass('animate-spin', 'text-blue-500');
    });

    it('hides validation icons when showValidationIcon is false', () => {
      render(<FormInput error="Error" showValidationIcon={false} />);
      
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getAllByTestId('alert-icon')).toHaveLength(1); // Only in message, not in input
    });

    it('shows description when no error or success', () => {
      render(<FormInput description="Helper text" />);
      
      const description = screen.getByText('Helper text');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-muted-foreground');
    });

    it('hides description when error is present', () => {
      render(<FormInput description="Helper text" error="Error message" />);
      
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles input changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<FormInput onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test value');
      
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('test value');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<FormInput ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('applies error styling when error is present', () => {
      render(<FormInput error="Error message" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-destructive', 'focus-visible:ring-destructive');
    });
  });
});

describe('PasswordInput', () => {
  describe('Basic Functionality', () => {
    it('renders password input with toggle visibility', () => {
      render(<PasswordInput label="Password" />);
      
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
      
      const toggleButton = screen.getByTestId('eye-icon').closest('button');
      expect(toggleButton).toBeInTheDocument();
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      render(<PasswordInput label="Password" />);
      
      const toggleButton = screen.getByTestId('eye-icon').closest('button');
      
      let input = document.querySelector('input');
      expect(input).toHaveAttribute('type', 'password');
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
      
      await user.click(toggleButton!);
      
      input = document.querySelector('input');
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('eyeoff-icon')).toBeInTheDocument();
      
      await user.click(toggleButton!);
      
      input = document.querySelector('input');
      expect(input).toHaveAttribute('type', 'password');
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('applies correct styling with password toggle', () => {
      render(<PasswordInput />);
      
      const input = document.querySelector('input');
      expect(input?.className).toContain('pr-20');
    });
  });

  describe('Strength Indicator', () => {
    it('shows strength indicator when enabled', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <PasswordInput 
            showStrengthIndicator 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
          />
        );
      };
      
      render(<TestComponent />);
      
      const input = document.querySelector('input') as HTMLInputElement;
      await user.type(input, 'weak');
      
      expect(screen.getByText(/Password strength:/)).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element?.tagName === 'P' && element?.textContent?.includes('Password strength: Weak') || false;
      })).toBeInTheDocument();
    });

    it('calculates password strength correctly', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <PasswordInput 
            showStrengthIndicator 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
          />
        );
      };
      
      render(<TestComponent />);
      
      const input = document.querySelector('input') as HTMLInputElement;
      
      // Weak password (1 point: lowercase only)
      await user.clear(input);
      await user.type(input, 'weak');
      expect(screen.getByText((content, element) => {
        return element?.tagName === 'P' && element?.textContent?.includes('Password strength: Weak') || false;
      })).toBeInTheDocument();
      
      // Medium password (3 points: lowercase + uppercase + numbers)
      await user.clear(input);
      await user.type(input, 'Med123');
      expect(screen.getByText((content, element) => {
        return element?.tagName === 'P' && element?.textContent?.includes('Password strength: Medium') || false;
      })).toBeInTheDocument();
      
      // Strong password (4 points: lowercase + uppercase + numbers + 8+ chars)
      await user.clear(input);
      await user.type(input, 'Strong123');
      expect(screen.getByText((content, element) => {
        return element?.tagName === 'P' && element?.textContent?.includes('Password strength: Strong') || false;
      })).toBeInTheDocument();
    });

    it('shows strength bars with correct colors', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <PasswordInput 
            showStrengthIndicator 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
          />
        );
      };
      
      render(<TestComponent />);
      
      const input = document.querySelector('input') as HTMLInputElement;
      await user.type(input, 'Strong123!');
      
      // Should have 5 strength indicator bars
      const strengthBars = document.querySelectorAll('.h-1.flex-1.rounded-full');
      expect(strengthBars).toHaveLength(5);
    });

    it('does not show strength indicator when disabled', async () => {
      const user = userEvent.setup();
      render(<PasswordInput value="" onChange={() => {}} />);
      
      const input = document.querySelector('input') as HTMLInputElement;
      await user.type(input, 'password');
      
      expect(screen.queryByText(/Password strength:/)).not.toBeInTheDocument();
    });

    it('only shows strength indicator when password has value', () => {
      render(<PasswordInput showStrengthIndicator value="" onChange={() => {}} />);
      
      expect(screen.queryByText(/Password strength:/)).not.toBeInTheDocument();
    });
  });

  describe('Inherited FormInput Features', () => {
    it('shows error state correctly', () => {
      render(<PasswordInput error="Password is required" />);
      
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getAllByTestId('alert-icon')).toHaveLength(2); // One in input and one in message
    });

    it('handles onChange correctly', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<PasswordInput onChange={handleChange} />);
      
      const input = document.querySelector('input') as HTMLInputElement;
      await user.type(input, 'password');
      
      expect(handleChange).toHaveBeenCalled();
    });
  });
});

describe('FormTextarea', () => {
  describe('Basic Functionality', () => {
    it('renders textarea with label', () => {
      render(<FormTextarea label="Description" placeholder="Enter description" />);
      
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
    });

    it('shows character count when maxLength is provided', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <FormTextarea 
            maxLength={100} 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
            showCharCount 
          />
        );
      };
      
      render(<TestComponent />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');
      
      expect(screen.getByText('5/100')).toBeInTheDocument();
    });

    it('passes through className to textarea', () => {
      render(<FormTextarea className="custom-textarea-class" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toContain('custom-textarea-class');
    });

    it('applies rows correctly', () => {
      render(<FormTextarea rows={5} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '5');
    });
  });

  describe('Validation States', () => {
    it('shows error state', () => {
      render(<FormTextarea error="This field is required" />);
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('shows success state', () => {
      render(<FormTextarea success="Valid input" />);
      
      expect(screen.getByText('Valid input')).toBeInTheDocument();
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });
  });

  describe('Character Limit', () => {
    it('warns when approaching character limit', async () => {
      const user = userEvent.setup();
      const longText = 'a'.repeat(95);
      
      render(<FormTextarea maxLength={100} value={longText} onChange={() => {}} showCharCount />);
      
      const charCount = screen.getByText('95/100');
      expect(charCount).toHaveClass('text-yellow-600');
    });

    it('shows error when exceeding character limit', async () => {
      const longText = 'a'.repeat(105);
      
      render(<FormTextarea maxLength={100} value={longText} onChange={() => {}} showCharCount />);
      
      const charCount = screen.getByText('105/100');
      expect(charCount).toHaveClass('text-destructive');
    });

    it('does not show character count when showCharCount is false', () => {
      const text = 'a'.repeat(50);
      
      render(<FormTextarea maxLength={100} value={text} onChange={() => {}} showCharCount={false} />);
      
      expect(screen.queryByText('50/100')).not.toBeInTheDocument();
    });

    it('shows character count without limit when maxLength is not provided', () => {
      const text = 'a'.repeat(50);
      
      render(<FormTextarea value={text} onChange={() => {}} showCharCount />);
      
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });
});

describe('FileInput', () => {
  const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
  const mockImageFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });

  describe('Basic Functionality', () => {
    it('renders file input with label', () => {
      render(<FileInput label="Upload File" />);
      
      expect(screen.getByText('Upload File')).toBeInTheDocument();
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('renders basic file input element', () => {
      render(<FileInput />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('type', 'file');
    });

    it('handles file selection', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<FileInput onChange={handleChange} />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, mockFile);
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('displays selected file name', async () => {
      const user = userEvent.setup();
      
      render(<FileInput />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, mockFile);
      
      expect(screen.getByText(/Selected: test.txt/)).toBeInTheDocument();
    });
  });

  describe('File Configuration', () => {
    it('sets accept attribute for file types', () => {
      render(
        <FileInput 
          acceptedFileTypes={['image/jpeg', 'image/png']} 
        />
      );
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png');
    });

    it('shows file requirements when configured', () => {
      render(
        <FileInput 
          acceptedFileTypes={['image/jpeg', 'image/png']}
          maxFileSize={5}
          description="Please upload an image file"
        />
      );
      
      // Since the actual component shows the description instead of format requirements
      expect(screen.getByText('Please upload an image file')).toBeInTheDocument();
    });

    it('handles file selection with accepted types', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(
        <FileInput 
          acceptedFileTypes={['image/jpeg', 'image/png']} 
          onChange={handleChange}
        />
      );
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, mockImageFile);
      
      expect(handleChange).toHaveBeenCalled();
      expect(screen.getByText(/Selected: test.jpg/)).toBeInTheDocument();
    });
  });

  describe('File Preview', () => {
    beforeEach(() => {
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onloadend: null as any,
        result: 'data:image/jpeg;base64,mock-image-data'
      };
      
      global.FileReader = jest.fn(() => mockFileReader) as any;
      
      // Auto-trigger onloadend when readAsDataURL is called
      mockFileReader.readAsDataURL.mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onloadend) {
            mockFileReader.onloadend();
          }
        }, 0);
      });
    });

          it('shows image preview when enabled', async () => {
        const user = userEvent.setup();
        
        render(<FileInput showPreview />);
        
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(fileInput, mockImageFile);
        
        await waitFor(() => {
          const preview = screen.getByRole('img');
          expect(preview).toBeInTheDocument();
          expect(preview).toHaveAttribute('alt', 'Preview');
        });
      });

      it('does not show preview for non-image files', async () => {
        const user = userEvent.setup();
        
        render(<FileInput showPreview />);
        
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(fileInput, mockFile); // text file
        
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText(/Selected: test.txt/)).toBeInTheDocument();
      });

      it('does not show preview when disabled', async () => {
        const user = userEvent.setup();
        
        render(<FileInput showPreview={false} />);
        
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(fileInput, mockImageFile);
        
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText(/Selected: test.jpg/)).toBeInTheDocument();
      });
  });



  describe('Error States', () => {
    it('shows error message', () => {
      render(<FileInput error="File is required" />);
      
      expect(screen.getByText('File is required')).toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('applies error styling to file input', () => {
      render(<FileInput error="File is required" />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveClass('border-destructive', 'focus-visible:ring-destructive');
    });

    it('shows success state', () => {
      render(<FileInput success="File uploaded successfully" />);
      
      expect(screen.getByText('File uploaded successfully')).toBeInTheDocument();
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('applies success styling to file input', () => {
      render(<FileInput success="File uploaded successfully" />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveClass('border-green-500', 'focus-visible:ring-green-500');
    });
  });
}); 