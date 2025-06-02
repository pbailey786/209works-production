/*
 * Demo Page Component Section Template
 * 
 * Copy this template for each new component you want to add to the demo page.
 * Replace [ComponentName] with the actual component name.
 * Update the imports, examples, and descriptions as needed.
 */

import React from "react";
import { [ComponentName] } from "@/components/ui/[component-name]";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Add this section to the main demo page
export function [ComponentName]DemoSection() {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-2 font-display">[Component Name]</h2>
      <div className="space-y-4">
        {/* Basic Example */}
        <div>
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">Basic Usage</h3>
          <[ComponentName]>
            Basic example content
          </[ComponentName]>
        </div>

        {/* Variants Example (if applicable) */}
        <div>
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">Variants</h3>
          <div className="flex gap-2 flex-wrap">
            <[ComponentName] variant="default">Default</[ComponentName]>
            <[ComponentName] variant="primary">Primary</[ComponentName]>
            <[ComponentName] variant="secondary">Secondary</[ComponentName]>
          </div>
        </div>

        {/* Sizes Example (if applicable) */}
        <div>
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">Sizes</h3>
          <div className="flex gap-2 items-center flex-wrap">
            <[ComponentName] size="sm">Small</[ComponentName]>
            <[ComponentName] size="default">Default</[ComponentName]>
            <[ComponentName] size="lg">Large</[ComponentName]>
          </div>
        </div>

        {/* States Example (if applicable) */}
        <div>
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">States</h3>
          <div className="flex gap-2 flex-wrap">
            <[ComponentName]>Normal</[ComponentName]>
            <[ComponentName] disabled>Disabled</[ComponentName]>
          </div>
        </div>

        {/* Interactive Example (if applicable) */}
        <div>
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">Interactive Demo</h3>
          <Demo[ComponentName] />
        </div>

        {/* Code Example */}
        <div>
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">Code Example</h3>
          <Card className="p-4 bg-muted">
            <pre className="text-sm overflow-x-auto">
              <code>{`import { ${[ComponentName]} } from "@/components/ui/[component-name]"

export function Example() {
  return (
    <${[ComponentName]}>
      Your content here
    </${[ComponentName]}>
  )
}`}</code>
            </pre>
          </Card>
        </div>
      </div>
    </section>
  );
}

// Interactive demo component (customize for each component)
function Demo[ComponentName]() {
  const [demoState, setDemoState] = React.useState(false);
  
  return (
    <div className="flex items-center gap-4">
      <[ComponentName] 
        onClick={() => setDemoState(!demoState)}
        // Add component-specific props
      >
        Click me (state: {demoState ? 'on' : 'off'})
      </[ComponentName]>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => setDemoState(!demoState)}
      >
        Toggle State
      </Button>
    </div>
  );
}

/*
 * Usage Instructions:
 * 
 * 1. Copy this template
 * 2. Replace [ComponentName] with actual component name (e.g., "Checkbox")
 * 3. Replace [component-name] with kebab-case name (e.g., "checkbox")
 * 4. Update the examples to match the component's actual API
 * 5. Add the component section to the main demo page:
 * 
 *    <[ComponentName]DemoSection />
 * 
 * 6. Import the demo section in the main demo page file
 */

/*
 * Common Component Patterns:
 * 
 * Form Components (Input, Checkbox, etc.):
 * - Include form integration example
 * - Show validation states
 * - Include label association
 * 
 * Overlay Components (Dialog, Popover, etc.):
 * - Show trigger interaction
 * - Include positioning options
 * - Demonstrate keyboard navigation
 * 
 * Navigation Components (Menu, Tabs, etc.):
 * - Show keyboard navigation
 * - Include active/selected states
 * - Demonstrate nested structures
 * 
 * Layout Components (Card, Separator, etc.):
 * - Show responsive behavior
 * - Include composition examples
 * - Demonstrate spacing/alignment
 */ 