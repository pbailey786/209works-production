# Component Name

## Overview

Brief description of what this component does and its primary use cases.

## Installation

```bash
# If component has specific dependencies
npm install @radix-ui/react-[component-name] # if applicable
```

## Usage

### Basic Example

```tsx
import { ComponentName } from '@/components/ui/component-name';

export function Example() {
  return <ComponentName>Basic usage example</ComponentName>;
}
```

### Advanced Example

```tsx
import {
  ComponentName,
  ComponentSubPart,
} from '@/components/ui/component-name';

export function AdvancedExample() {
  return (
    <ComponentName variant="primary" size="lg">
      <ComponentSubPart>
        Advanced usage with props and sub-components
      </ComponentSubPart>
    </ComponentName>
  );
}
```

## API Reference

### ComponentName Props

| Prop        | Type                                    | Default     | Description                       |
| ----------- | --------------------------------------- | ----------- | --------------------------------- |
| `variant`   | `"default" \| "primary" \| "secondary"` | `"default"` | Visual style variant              |
| `size`      | `"sm" \| "default" \| "lg"`             | `"default"` | Size of the component             |
| `disabled`  | `boolean`                               | `false`     | Whether the component is disabled |
| `className` | `string`                                | `undefined` | Additional CSS classes            |
| `children`  | `ReactNode`                             | `undefined` | Content to display                |

### Sub-components (if applicable)

| Component          | Description                   |
| ------------------ | ----------------------------- |
| `ComponentTrigger` | Triggers the component action |
| `ComponentContent` | Main content area             |

## Variants

### Default

```tsx
<ComponentName>Default variant</ComponentName>
```

### Primary

```tsx
<ComponentName variant="primary">Primary variant</ComponentName>
```

### Secondary

```tsx
<ComponentName variant="secondary">Secondary variant</ComponentName>
```

## States

### Default State

```tsx
<ComponentName>Normal state</ComponentName>
```

### Disabled State

```tsx
<ComponentName disabled>Disabled state</ComponentName>
```

### Loading State (if applicable)

```tsx
<ComponentName loading>Loading state</ComponentName>
```

## Dark Mode Support

This component automatically adapts to dark mode using CSS variables. The component uses:

- `bg-background` for backgrounds
- `text-foreground` for text
- `border-border` for borders

## Accessibility

- **ARIA**: Component includes proper ARIA attributes
- **Keyboard Navigation**: Supports standard keyboard interactions
- **Screen Reader**: Compatible with screen readers
- **Focus Management**: Proper focus handling

### Keyboard Shortcuts (if applicable)

| Key      | Action                 |
| -------- | ---------------------- |
| `Enter`  | Activate component     |
| `Space`  | Alternative activation |
| `Escape` | Close/cancel           |

## Customization

### Custom Styles

```tsx
<ComponentName className="custom-class">Custom styled component</ComponentName>
```

### Theme Variables

The component uses these CSS custom properties:

```css
:root {
  --primary: /* primary color */ --background: /* background color */
    --foreground: /* text color */ --border: /* border color */;
}
```

## Examples in Context

### Form Integration

```tsx
import { ComponentName } from '@/components/ui/component-name';
import { Button } from '@/components/ui/button';

export function FormExample() {
  return (
    <form>
      <ComponentName name="field" />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### With Other Components

```tsx
import { ComponentName } from '@/components/ui/component-name';
import { Card } from '@/components/ui/card';

export function CompositionExample() {
  return (
    <Card>
      <ComponentName>Component within a card</ComponentName>
    </Card>
  );
}
```

## Common Patterns

### Pattern 1: Basic Usage

Description of when to use this pattern.

```tsx
<ComponentName>Basic pattern</ComponentName>
```

### Pattern 2: Advanced Usage

Description of advanced use case.

```tsx
<ComponentName variant="primary" size="lg">
  Advanced pattern
</ComponentName>
```

## Troubleshooting

### Common Issues

1. **Issue**: Component not rendering

   - **Solution**: Ensure all required props are provided

2. **Issue**: Styling not applying
   - **Solution**: Check CSS import order and theme variables

### TypeScript

The component is fully typed. Import types if needed:

```tsx
import { ComponentProps } from '@/components/ui/component-name';

type MyComponentProps = ComponentProps & {
  customProp: string;
};
```

## Related Components

- [Button](/docs/components/button) - For actions
- [Card](/docs/components/card) - For containers
- [Input](/docs/components/input) - For form inputs

## Changelog

- v1.0.0: Initial implementation
- v1.1.0: Added variant support
- v1.2.0: Added accessibility improvements
