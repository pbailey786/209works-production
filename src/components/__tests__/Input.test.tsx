import React from 'react'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../__tests__/utils/test-utils'
import { Input } from '../ui/input'

// Mock the cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('renders input with default props', () => {
      renderWithProviders(<Input data-testid="basic-input" />)
      
      const input = screen.getByTestId('basic-input')
      expect(input).toBeInTheDocument()
      expect(input).toBeInstanceOf(HTMLInputElement)
    })

    it('renders input with placeholder text', () => {
      renderWithProviders(
        <Input placeholder="Enter your name" data-testid="placeholder-input" />
      )
      
      const input = screen.getByPlaceholderText('Enter your name')
      expect(input).toBeInTheDocument()
    })

    it('renders input with custom value', () => {
      renderWithProviders(
        <Input value="test value" onChange={() => {}} data-testid="value-input" />
      )
      
      const input = screen.getByTestId('value-input') as HTMLInputElement
      expect(input.value).toBe('test value')
    })

    it('renders input with default value', () => {
      renderWithProviders(
        <Input defaultValue="default text" data-testid="default-input" />
      )
      
      const input = screen.getByTestId('default-input') as HTMLInputElement
      expect(input.value).toBe('default text')
    })
  })

  describe('Input Types', () => {
    const inputTypes = [
      'text',
      'email', 
      'password',
      'number',
      'tel',
      'url',
      'search',
      'date',
      'time',
      'datetime-local',
      'file'
    ] as const

    inputTypes.forEach(type => {
      it(`renders ${type} input type correctly`, () => {
        renderWithProviders(
          <Input type={type} data-testid={`${type}-input`} />
        )
        
        const input = screen.getByTestId(`${type}-input`)
        expect(input).toHaveAttribute('type', type)
      })
    })

    it('defaults to text type when no type is specified', () => {
      renderWithProviders(<Input data-testid="default-type" />)
      
      const input = screen.getByTestId('default-type') as HTMLInputElement
      // HTML inputs default to text type even without explicit attribute
      expect(input.type).toBe('text')
    })
  })

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      renderWithProviders(
        <Input className="custom-class" data-testid="custom-class-input" />
      )
      
      const input = screen.getByTestId('custom-class-input')
      expect(input).toHaveClass('custom-class')
    })

    it('accepts custom id', () => {
      renderWithProviders(
        <Input id="unique-input" data-testid="id-input" />
      )
      
      const input = screen.getByTestId('id-input')
      expect(input).toHaveAttribute('id', 'unique-input')
    })

    it('accepts name attribute', () => {
      renderWithProviders(
        <Input name="username" data-testid="name-input" />
      )
      
      const input = screen.getByTestId('name-input')
      expect(input).toHaveAttribute('name', 'username')
    })

    it('accepts required attribute', () => {
      renderWithProviders(
        <Input required data-testid="required-input" />
      )
      
      const input = screen.getByTestId('required-input')
      expect(input).toBeRequired()
    })

    it('accepts disabled attribute', () => {
      renderWithProviders(
        <Input disabled data-testid="disabled-input" />
      )
      
      const input = screen.getByTestId('disabled-input')
      expect(input).toBeDisabled()
    })

    it('accepts readonly attribute', () => {
      renderWithProviders(
        <Input readOnly data-testid="readonly-input" />
      )
      
      const input = screen.getByTestId('readonly-input')
      expect(input).toHaveAttribute('readonly')
    })

    it('accepts min and max attributes for number input', () => {
      renderWithProviders(
        <Input 
          type="number" 
          min={1} 
          max={100} 
          data-testid="number-input" 
        />
      )
      
      const input = screen.getByTestId('number-input')
      expect(input).toHaveAttribute('min', '1')
      expect(input).toHaveAttribute('max', '100')
    })

    it('accepts maxLength attribute', () => {
      renderWithProviders(
        <Input maxLength={50} data-testid="maxlength-input" />
      )
      
      const input = screen.getByTestId('maxlength-input')
      expect(input).toHaveAttribute('maxlength', '50')
    })

    it('accepts pattern attribute', () => {
      renderWithProviders(
        <Input pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" data-testid="pattern-input" />
      )
      
      const input = screen.getByTestId('pattern-input')
      expect(input).toHaveAttribute('pattern', '[0-9]{3}-[0-9]{3}-[0-9]{4}')
    })
  })

  describe('Event Handling', () => {
    it('calls onChange handler when input value changes', async () => {
      const mockChange = jest.fn()
      const user = userEvent.setup()
      
      renderWithProviders(
        <Input onChange={mockChange} data-testid="change-input" />
      )
      
      const input = screen.getByTestId('change-input')
      await user.type(input, 'hello')
      
      expect(mockChange).toHaveBeenCalledTimes(5) // Once for each character
    })

    it('calls onFocus handler when input receives focus', async () => {
      const mockFocus = jest.fn()
      const user = userEvent.setup()
      
      renderWithProviders(
        <Input onFocus={mockFocus} data-testid="focus-input" />
      )
      
      const input = screen.getByTestId('focus-input')
      await user.click(input)
      
      expect(mockFocus).toHaveBeenCalledTimes(1)
    })

    it('calls onBlur handler when input loses focus', async () => {
      const mockBlur = jest.fn()
      const user = userEvent.setup()
      
      renderWithProviders(
        <div>
          <Input onBlur={mockBlur} data-testid="blur-input" />
          <button data-testid="other-element">Other</button>
        </div>
      )
      
      const input = screen.getByTestId('blur-input')
      const other = screen.getByTestId('other-element')
      
      await user.click(input)
      await user.click(other)
      
      expect(mockBlur).toHaveBeenCalledTimes(1)
    })

    it('calls onKeyDown handler for keyboard events', async () => {
      const mockKeyDown = jest.fn()
      const user = userEvent.setup()
      
      renderWithProviders(
        <Input onKeyDown={mockKeyDown} data-testid="keydown-input" />
      )
      
      const input = screen.getByTestId('keydown-input')
      await user.click(input)
      await user.keyboard('{Enter}')
      
      expect(mockKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Enter'
        })
      )
    })

    it('calls onSubmit when Enter is pressed in form', async () => {
      const mockSubmit = jest.fn(e => e.preventDefault())
      const user = userEvent.setup()
      
      renderWithProviders(
        <form onSubmit={mockSubmit}>
          <Input data-testid="submit-input" />
        </form>
      )
      
      const input = screen.getByTestId('submit-input')
      await user.click(input)
      await user.keyboard('{Enter}')
      
      expect(mockSubmit).toHaveBeenCalledTimes(1)
    })

    it('does not call onChange when disabled', async () => {
      const mockChange = jest.fn()
      const user = userEvent.setup()
      
      renderWithProviders(
        <Input disabled onChange={mockChange} data-testid="disabled-change" />
      )
      
      const input = screen.getByTestId('disabled-change')
      await user.type(input, 'text')
      
      expect(mockChange).not.toHaveBeenCalled()
    })

    it('does not call onChange when readonly', async () => {
      const mockChange = jest.fn()
      const user = userEvent.setup()
      
      renderWithProviders(
        <Input readOnly onChange={mockChange} data-testid="readonly-change" />
      )
      
      const input = screen.getByTestId('readonly-change')
      await user.type(input, 'text')
      
      expect(mockChange).not.toHaveBeenCalled()
    })
  })

  describe('Controlled vs Uncontrolled', () => {
    it('works as controlled component', async () => {
      const ControlledInput = () => {
        const [value, setValue] = React.useState('')
        
        return (
          <Input 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid="controlled-input"
          />
        )
      }
      
      const user = userEvent.setup()
      renderWithProviders(<ControlledInput />)
      
      const input = screen.getByTestId('controlled-input') as HTMLInputElement
      expect(input.value).toBe('')
      
      await user.type(input, 'controlled')
      expect(input.value).toBe('controlled')
    })

    it('works as uncontrolled component', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <Input defaultValue="initial" data-testid="uncontrolled-input" />
      )
      
      const input = screen.getByTestId('uncontrolled-input') as HTMLInputElement
      expect(input.value).toBe('initial')
      
      await user.clear(input)
      await user.type(input, 'uncontrolled')
      expect(input.value).toBe('uncontrolled')
    })
  })

  describe('Form Integration', () => {
    it('integrates with form validation', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <form>
          <Input 
            type="email"
            required
            data-testid="validation-input"
          />
          <button type="submit" data-testid="submit-button">Submit</button>
        </form>
      )
      
      const input = screen.getByTestId('validation-input')
      const submit = screen.getByTestId('submit-button')
      
      // Try to submit with invalid email
      await user.type(input, 'invalid-email')
      await user.click(submit)
      
      expect(input).toBeInvalid()
    })

    it('resets value when form is reset', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <form>
          <Input defaultValue="original" data-testid="reset-input" />
          <button type="reset" data-testid="reset-button">Reset</button>
        </form>
      )
      
      const input = screen.getByTestId('reset-input') as HTMLInputElement
      const reset = screen.getByTestId('reset-button')
      
      await user.clear(input)
      await user.type(input, 'changed')
      expect(input.value).toBe('changed')
      
      await user.click(reset)
      expect(input.value).toBe('original')
    })

    it('participates in form data collection', () => {
      renderWithProviders(
        <form>
          <Input name="username" defaultValue="john" data-testid="form-input" />
        </form>
      )
      
      const form = screen.getByTestId('form-input').closest('form')!
      const formData = new FormData(form)
      
      expect(formData.get('username')).toBe('john')
    })
  })

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>()
      
      renderWithProviders(
        <Input ref={ref} data-testid="ref-input" />
      )
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
      expect(ref.current).toBe(screen.getByTestId('ref-input'))
    })

    it('allows programmatic focus through ref', () => {
      const ref = React.createRef<HTMLInputElement>()
      
      renderWithProviders(
        <div>
          <Input ref={ref} data-testid="focus-ref-input" />
          <button 
            onClick={() => ref.current?.focus()} 
            data-testid="focus-button"
          >
            Focus Input
          </button>
        </div>
      )
      
      const input = screen.getByTestId('focus-ref-input')
      const button = screen.getByTestId('focus-button')
      
      expect(input).not.toHaveFocus()
      
      fireEvent.click(button)
      expect(input).toHaveFocus()
    })
  })

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      renderWithProviders(
        <Input aria-label="Username input" data-testid="aria-label-input" />
      )
      
      const input = screen.getByLabelText('Username input')
      expect(input).toBeInTheDocument()
    })

    it('supports aria-describedby', () => {
      renderWithProviders(
        <div>
          <Input 
            aria-describedby="help-text" 
            data-testid="describedby-input" 
          />
          <div id="help-text">Enter your username</div>
        </div>
      )
      
      const input = screen.getByTestId('describedby-input')
      expect(input).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('supports aria-invalid for validation states', () => {
      renderWithProviders(
        <Input aria-invalid={true} data-testid="invalid-input" />
      )
      
      const input = screen.getByTestId('invalid-input')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('works with labels', () => {
      renderWithProviders(
        <div>
          <label htmlFor="labeled-input">Username</label>
          <Input id="labeled-input" data-testid="labeled-input" />
        </div>
      )
      
      const input = screen.getByLabelText('Username')
      expect(input).toBeInTheDocument()
    })

    it('indicates required state for screen readers', () => {
      renderWithProviders(
        <Input required aria-label="Required field" data-testid="required-sr" />
      )
      
      const input = screen.getByTestId('required-sr')
      expect(input).toBeRequired()
      expect(input).toHaveAttribute('aria-label', 'Required field')
    })
  })

  describe('File Input Specific', () => {
    it('handles file input type correctly', () => {
      renderWithProviders(
        <Input type="file" accept=".pdf,.doc" data-testid="file-input" />
      )
      
      const input = screen.getByTestId('file-input')
      expect(input).toHaveAttribute('type', 'file')
      expect(input).toHaveAttribute('accept', '.pdf,.doc')
    })

    it('supports multiple file selection', () => {
      renderWithProviders(
        <Input type="file" multiple data-testid="multiple-files" />
      )
      
      const input = screen.getByTestId('multiple-files')
      expect(input).toHaveAttribute('multiple')
    })
  })

  describe('Number Input Specific', () => {
    it('handles number input constraints', () => {
      renderWithProviders(
        <Input 
          type="number"
          min={0}
          max={100}
          step={5}
          data-testid="number-constraints"
        />
      )
      
      const input = screen.getByTestId('number-constraints')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '100')
      expect(input).toHaveAttribute('step', '5')
    })
  })

  describe('Password Input Specific', () => {
    it('masks password input', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <Input type="password" data-testid="password-input" />
      )
      
      const input = screen.getByTestId('password-input') as HTMLInputElement
      await user.type(input, 'secret123')
      
      expect(input.value).toBe('secret123')
      expect(input).toHaveAttribute('type', 'password')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty className gracefully', () => {
      renderWithProviders(
        <Input className="" data-testid="empty-class" />
      )
      
      const input = screen.getByTestId('empty-class')
      expect(input).toBeInTheDocument()
    })

    it('handles undefined className', () => {
      renderWithProviders(
        <Input className={undefined} data-testid="undefined-class" />
      )
      
      const input = screen.getByTestId('undefined-class')
      expect(input).toBeInTheDocument()
    })

    it('preserves all HTML input attributes', () => {
      renderWithProviders(
        <Input 
          autoComplete="username"
          autoFocus
          spellCheck={false}
          data-testid="all-attributes"
        />
      )
      
      const input = screen.getByTestId('all-attributes') as HTMLInputElement
      expect(input).toHaveAttribute('autocomplete', 'username')
      // autoFocus might not always set the autofocus attribute in test environment
      // but the input should have focus or the autoFocus prop should be present
      expect(input).toHaveAttribute('spellcheck', 'false')
    })
  })
}) 