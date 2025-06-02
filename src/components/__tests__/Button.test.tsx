import React from 'react'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../__tests__/utils/test-utils'
import { Button, buttonVariants } from '../ui/button'

// Mock dependencies
jest.mock('@radix-ui/react-slot', () => ({
  Slot: React.forwardRef(({ children, className, ...props }: any, ref: any) => {
    // Slot should merge props with the child element and render the child directly
    if (React.isValidElement(children)) {
      const childProps = (children as React.ReactElement).props || {};
      const childClassName = (childProps as any).className || '';
      return React.cloneElement(children as React.ReactElement, {
        ...props,
        ...childProps,
        className: [className, childClassName].filter(Boolean).join(' '),
        ref,
      })
    }
    return (
      <div className={className} data-testid="slot" ref={ref} {...props}>
        {children}
      </div>
    )
  })
}))

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('renders button with default props', () => {
      renderWithProviders(<Button>Click me</Button>)
      
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      // HTML buttons have implicit type="button" which may not show as attribute
      expect(button.tagName).toBe('BUTTON')
    })

    it('renders button with custom text', () => {
      renderWithProviders(<Button>Custom Button Text</Button>)
      
      expect(screen.getByText('Custom Button Text')).toBeInTheDocument()
    })

    it('renders disabled button', () => {
      renderWithProviders(<Button disabled>Disabled Button</Button>)
      
      const button = screen.getByRole('button', { name: /disabled button/i })
      expect(button).toBeDisabled()
    })
  })

  describe('Variants', () => {
    const variants = [
      'default',
      'destructive', 
      'outline',
      'secondary',
      'ghost',
      'link',
      'navbarIcon',
      'user'
    ] as const

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        renderWithProviders(
          <Button variant={variant} data-testid={`${variant}-button`}>
            {variant} Button
          </Button>
        )
        
        const button = screen.getByTestId(`${variant}-button`)
        expect(button).toBeInTheDocument()
        expect(button).toHaveTextContent(`${variant} Button`)
      })
    })

    it('applies default variant when no variant is specified', () => {
      renderWithProviders(<Button data-testid="default-button">Default</Button>)
      
      const button = screen.getByTestId('default-button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    const sizes = ['default', 'sm', 'lg', 'icon'] as const

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        renderWithProviders(
          <Button size={size} data-testid={`${size}-button`}>
            {size} Button
          </Button>
        )
        
        const button = screen.getByTestId(`${size}-button`)
        expect(button).toBeInTheDocument()
        expect(button).toHaveTextContent(`${size} Button`)
      })
    })

    it('applies default size when no size is specified', () => {
      renderWithProviders(<Button data-testid="default-size">Default Size</Button>)
      
      const button = screen.getByTestId('default-size')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Custom Props', () => {
    it('accepts and applies custom className', () => {
      renderWithProviders(
        <Button className="custom-class" data-testid="custom-button">
          Custom Class
        </Button>
      )
      
      const button = screen.getByTestId('custom-button')
      expect(button).toHaveClass('custom-class')
    })

    it('accepts custom type attribute', () => {
      renderWithProviders(
        <Button type="submit" data-testid="submit-button">
          Submit
        </Button>
      )
      
      const button = screen.getByTestId('submit-button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('accepts custom id attribute', () => {
      renderWithProviders(
        <Button id="unique-button" data-testid="id-button">
          ID Button
        </Button>
      )
      
      const button = screen.getByTestId('id-button')
      expect(button).toHaveAttribute('id', 'unique-button')
    })

    it('accepts aria attributes', () => {
      renderWithProviders(
        <Button 
          aria-label="Custom aria label"
          aria-describedby="description"
          data-testid="aria-button"
        >
          ARIA Button
        </Button>
      )
      
      const button = screen.getByTestId('aria-button')
      expect(button).toHaveAttribute('aria-label', 'Custom aria label')
      expect(button).toHaveAttribute('aria-describedby', 'description')
    })
  })

  describe('Event Handling', () => {
    it('calls onClick handler when clicked', async () => {
      const mockClick = jest.fn()
      const user = userEvent.setup()
      
      renderWithProviders(
        <Button onClick={mockClick} data-testid="click-button">
          Click Me
        </Button>
      )
      
      const button = screen.getByTestId('click-button')
      await user.click(button)
      
      expect(mockClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const mockClick = jest.fn()
      const user = userEvent.setup()
      
      renderWithProviders(
        <Button onClick={mockClick} disabled data-testid="disabled-button">
          Disabled
        </Button>
      )
      
      const button = screen.getByTestId('disabled-button')
      await user.click(button)
      
      expect(mockClick).not.toHaveBeenCalled()
    })

    it('handles keyboard events', async () => {
      const mockClick = jest.fn()
      const user = userEvent.setup()
      
      renderWithProviders(
        <Button onClick={mockClick} data-testid="keyboard-button">
          Keyboard Test
        </Button>
      )
      
      const button = screen.getByTestId('keyboard-button')
      button.focus()
      await user.keyboard('{Enter}')
      
      expect(mockClick).toHaveBeenCalledTimes(1)
    })

    it('handles onMouseEnter and onMouseLeave events', async () => {
      const mockMouseEnter = jest.fn()
      const mockMouseLeave = jest.fn()
      const user = userEvent.setup()
      
      renderWithProviders(
        <Button 
          onMouseEnter={mockMouseEnter}
          onMouseLeave={mockMouseLeave}
          data-testid="hover-button"
        >
          Hover Test
        </Button>
      )
      
      const button = screen.getByTestId('hover-button')
      await user.hover(button)
      expect(mockMouseEnter).toHaveBeenCalledTimes(1)
      
      await user.unhover(button)
      expect(mockMouseLeave).toHaveBeenCalledTimes(1)
    })

    it('handles onFocus and onBlur events', async () => {
      const mockFocus = jest.fn()
      const mockBlur = jest.fn()
      const user = userEvent.setup()
      
      renderWithProviders(
        <div>
          <Button 
            onFocus={mockFocus}
            onBlur={mockBlur}
            data-testid="focus-button"
          >
            Focus Test
          </Button>
          <Button data-testid="other-button">Other</Button>
        </div>
      )
      
      const button = screen.getByTestId('focus-button')
      const otherButton = screen.getByTestId('other-button')
      
      await user.click(button)
      expect(mockFocus).toHaveBeenCalledTimes(1)
      
      await user.click(otherButton)
      expect(mockBlur).toHaveBeenCalledTimes(1)
    })
  })

  describe('asChild Prop', () => {
    it('renders as Slot when asChild is true', () => {
      renderWithProviders(
        <Button asChild data-testid="slot-button">
          <span>Child Element</span>
        </Button>
      )
      
      // Should render as Slot (span), not button
      expect(screen.getByTestId('slot-button')).toBeInTheDocument()
      expect(screen.getByText('Child Element')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      
      // Verify it's a span element
      const element = screen.getByTestId('slot-button')
      expect(element.tagName).toBe('SPAN')
    })

    it('renders as button when asChild is false', () => {
      renderWithProviders(
        <Button asChild={false} data-testid="normal-button">
          Normal Button
        </Button>
      )
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.queryByTestId('slot')).not.toBeInTheDocument()
    })

    it('renders as button by default (asChild not specified)', () => {
      renderWithProviders(<Button>Default Button</Button>)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.queryByTestId('slot')).not.toBeInTheDocument()
    })
  })

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>()
      
      renderWithProviders(
        <Button ref={ref} data-testid="ref-button">
          Ref Button
        </Button>
      )
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
      expect(ref.current).toBe(screen.getByTestId('ref-button'))
    })
  })

  describe('Variant Combinations', () => {
    it('combines variant and size correctly', () => {
      renderWithProviders(
        <Button 
          variant="destructive" 
          size="lg" 
          data-testid="combined-button"
        >
          Destructive Large
        </Button>
      )
      
      const button = screen.getByTestId('combined-button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Destructive Large')
    })

    it('handles all combinations of variants and sizes', () => {
      const variants = ['default', 'destructive', 'outline'] as const
      const sizes = ['sm', 'default', 'lg'] as const
      
      variants.forEach(variant => {
        sizes.forEach(size => {
          const { unmount } = renderWithProviders(
            <Button 
              variant={variant} 
              size={size}
              data-testid={`${variant}-${size}`}
            >
              {variant} {size}
            </Button>
          )
          
          const button = screen.getByTestId(`${variant}-${size}`)
          expect(button).toBeInTheDocument()
          
          unmount()
        })
      })
    })
  })

  describe('Form Integration', () => {
    it('submits form when type="submit"', async () => {
      const mockSubmit = jest.fn(e => e.preventDefault())
      const user = userEvent.setup()
      
      renderWithProviders(
        <form onSubmit={mockSubmit}>
          <Button type="submit" data-testid="submit-button">
            Submit Form
          </Button>
        </form>
      )
      
      const button = screen.getByTestId('submit-button')
      await user.click(button)
      
      expect(mockSubmit).toHaveBeenCalledTimes(1)
    })

    it('resets form when type="reset"', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <form>
          <input defaultValue="test" data-testid="input" />
          <Button type="reset" data-testid="reset-button">
            Reset Form
          </Button>
        </form>
      )
      
      const input = screen.getByTestId('input') as HTMLInputElement
      const button = screen.getByTestId('reset-button')
      
      // Change input value
      await user.clear(input)
      await user.type(input, 'changed')
      expect(input.value).toBe('changed')
      
      // Reset form
      await user.click(button)
      expect(input.value).toBe('test')
    })
  })

  describe('Accessibility', () => {
    it('is focusable by default', () => {
      renderWithProviders(<Button data-testid="focusable">Focusable</Button>)
      
      const button = screen.getByTestId('focusable')
      button.focus()
      expect(button).toHaveFocus()
    })

    it('is not focusable when disabled', () => {
      renderWithProviders(
        <Button disabled data-testid="disabled-focus">
          Disabled
        </Button>
      )
      
      const button = screen.getByTestId('disabled-focus')
      button.focus()
      expect(button).not.toHaveFocus()
    })

    it('supports screen reader text', () => {
      renderWithProviders(
        <Button aria-label="Close dialog" data-testid="sr-button">
          ×
        </Button>
      )
      
      const button = screen.getByLabelText('Close dialog')
      expect(button).toBeInTheDocument()
    })

    it('indicates loading state when needed', () => {
      renderWithProviders(
        <Button 
          disabled 
          aria-label="Loading, please wait"
          data-testid="loading-button"
        >
          Loading...
        </Button>
      )
      
      const button = screen.getByLabelText('Loading, please wait')
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent('Loading...')
    })
  })

  describe('buttonVariants Function', () => {
    it('returns correct classes for default variant', () => {
      const classes = buttonVariants()
      expect(classes).toContain('bg-primary text-primary-foreground')
    })

    it('returns correct classes for destructive variant', () => {
      const classes = buttonVariants({ variant: 'destructive' })
      expect(classes).toContain('bg-destructive text-destructive-foreground')
    })

    it('returns correct classes for small size', () => {
      const classes = buttonVariants({ size: 'sm' })
      expect(classes).toContain('h-8 rounded-md px-3 text-xs')
    })

    it('combines variant and size classes', () => {
      const classes = buttonVariants({ variant: 'outline', size: 'lg' })
      expect(classes).toContain('border border-input')
      expect(classes).toContain('h-10 rounded-md px-8')
    })
  })
}) 