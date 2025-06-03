import React from 'react';

// Component registry types
export interface ComponentInfo {
  name: string;
  component: React.ComponentType<any>;
  version: string;
  deprecated?: boolean;
  replacement?: string;
  category:
    | 'form'
    | 'feedback'
    | 'overlay'
    | 'navigation'
    | 'layout'
    | 'data'
    | 'utility';
  description?: string;
  props?: Record<string, any>;
  dependencies?: string[];
}

export interface ComponentRegistry {
  components: Map<string, ComponentInfo>;
  aliases: Map<string, string>; // alias -> component name
  conflicts: Map<string, string[]>; // component name -> conflicting components
}

// Global component registry
class UIComponentRegistry {
  private registry: ComponentRegistry = {
    components: new Map(),
    aliases: new Map(),
    conflicts: new Map(),
  };

  private listeners: Set<() => void> = new Set();

  // Register a component
  register(info: ComponentInfo): void {
    const { name } = info;

    // Check for conflicts
    if (this.registry.components.has(name)) {
      const existing = this.registry.components.get(name)!;
      console.warn(
        `Component "${name}" is already registered. Replacing version ${existing.version} with ${info.version}`
      );

      // Track conflicts
      if (!this.registry.conflicts.has(name)) {
        this.registry.conflicts.set(name, []);
      }
      this.registry.conflicts.get(name)!.push(existing.version);
    }

    // Register component
    this.registry.components.set(name, info);

    // Notify listeners
    this.notifyListeners();
  }

  // Register an alias for a component
  registerAlias(alias: string, componentName: string): void {
    if (!this.registry.components.has(componentName)) {
      throw new Error(
        `Cannot create alias "${alias}" for non-existent component "${componentName}"`
      );
    }

    if (this.registry.aliases.has(alias)) {
      console.warn(`Alias "${alias}" already exists. Overwriting.`);
    }

    this.registry.aliases.set(alias, componentName);
    this.notifyListeners();
  }

  // Get a component by name or alias
  get(nameOrAlias: string): ComponentInfo | null {
    // Check direct name first
    if (this.registry.components.has(nameOrAlias)) {
      return this.registry.components.get(nameOrAlias)!;
    }

    // Check aliases
    const realName = this.registry.aliases.get(nameOrAlias);
    if (realName && this.registry.components.has(realName)) {
      return this.registry.components.get(realName)!;
    }

    return null;
  }

  // Get all components
  getAll(): ComponentInfo[] {
    return Array.from(this.registry.components.values());
  }

  // Get conflicts for a component
  getConflicts(name: string): string[] {
    return this.registry.conflicts.get(name) || [];
  }

  // Get component usage statistics
  getStats(): {
    total: number;
    byCategory: Record<string, number>;
    deprecated: number;
    conflicts: number;
  } {
    const components = this.getAll();
    const byCategory: Record<string, number> = {};

    components.forEach(component => {
      byCategory[component.category] =
        (byCategory[component.category] || 0) + 1;
    });

    return {
      total: components.length,
      byCategory,
      deprecated: components.filter(c => c.deprecated).length,
      conflicts: this.registry.conflicts.size,
    };
  }

  // Subscribe to registry changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in registry listener:', error);
      }
    });
  }

  // Export registry state for debugging
  export(): {
    components: Array<[string, ComponentInfo]>;
    aliases: Array<[string, string]>;
    conflicts: Array<[string, string[]]>;
  } {
    return {
      components: Array.from(this.registry.components.entries()),
      aliases: Array.from(this.registry.aliases.entries()),
      conflicts: Array.from(this.registry.conflicts.entries()),
    };
  }
}

// Global registry instance
export const componentRegistry = new UIComponentRegistry();

// Component wrapper that automatically registers components
export function withRegistry<P extends object>(
  component: React.ComponentType<P>,
  info: Omit<ComponentInfo, 'component'>
): React.ComponentType<P> {
  // Register the component
  componentRegistry.register({
    ...info,
    component,
  });

  // Return the component with type assertion to avoid complex forwardRef issues
  return component;
}

// Utility to create a component factory
export function createComponentFactory(category: ComponentInfo['category']) {
  return function registerComponent<P extends object>(
    component: React.ComponentType<P>,
    options: Omit<ComponentInfo, 'component' | 'category'>
  ): React.ComponentType<P> {
    return withRegistry(component, {
      ...options,
      category,
    });
  };
}

// Pre-defined factories for different categories
export const createFormComponent = createComponentFactory('form');
export const createFeedbackComponent = createComponentFactory('feedback');
export const createOverlayComponent = createComponentFactory('overlay');
export const createNavigationComponent = createComponentFactory('navigation');
export const createLayoutComponent = createComponentFactory('layout');
export const createDataComponent = createComponentFactory('data');
export const createUtilityComponent = createComponentFactory('utility');

// Export registry for direct access (use sparingly)
export { componentRegistry as registry };
