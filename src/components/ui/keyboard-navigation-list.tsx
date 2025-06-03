import React, {
  useState,
  useRef,
  useEffect,
  Children,
  cloneElement,
  isValidElement,
} from 'react';
import { useRovingTabIndex } from '@/hooks/useKeyboardNavigation';

interface KeyboardNavigationListProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical' | 'both';
  className?: string;
  role?: string;
  ariaLabel?: string;
  onSelectionChange?: (index: number) => void;
  defaultSelectedIndex?: number;
  wrap?: boolean; // Whether to wrap around when reaching the end
}

export function KeyboardNavigationList({
  children,
  orientation = 'vertical',
  className = '',
  role = 'list',
  ariaLabel,
  onSelectionChange,
  defaultSelectedIndex = 0,
  wrap = true,
}: KeyboardNavigationListProps) {
  const [activeIndex, setActiveIndex] = useState(defaultSelectedIndex);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const childArray = Children.toArray(children);
  const validChildren = childArray.filter(isValidElement);

  // Update refs array when children change
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, validChildren.length);
  }, [validChildren.length]);

  const handleIndexChange = (newIndex: number) => {
    setActiveIndex(newIndex);
    onSelectionChange?.(newIndex);
  };

  const { handleKeyDown } = useRovingTabIndex(
    itemRefs.current.filter(Boolean) as HTMLElement[],
    activeIndex,
    handleIndexChange,
    orientation
  );

  const enhancedChildren = validChildren.map((child, index) => {
    if (!isValidElement(child)) return child;

    const childProps = child.props as any;
    const childRef = (child as any).ref;

    return cloneElement(child as any, {
      ...(childProps || {}),
      ref: (el: HTMLElement | null) => {
        itemRefs.current[index] = el;
        // Call original ref if it exists
        if (typeof childRef === 'function') {
          childRef(el);
        } else if (childRef && typeof childRef === 'object') {
          childRef.current = el;
        }
      },
      tabIndex: index === activeIndex ? 0 : -1,
      'aria-selected': index === activeIndex,
      role: role === 'list' ? 'listitem' : childProps?.role || undefined,
      onKeyDown: (event: KeyboardEvent) => {
        handleKeyDown(event, index);
        // Call original onKeyDown if it exists
        if (
          childProps?.onKeyDown &&
          typeof childProps.onKeyDown === 'function'
        ) {
          childProps.onKeyDown(event);
        }
      },
      onFocus: () => {
        setActiveIndex(index);
        // Call original onFocus if it exists
        if (childProps?.onFocus && typeof childProps.onFocus === 'function') {
          childProps.onFocus();
        }
      },
      onClick: () => {
        setActiveIndex(index);
        onSelectionChange?.(index);
        // Call original onClick if it exists
        if (childProps?.onClick && typeof childProps.onClick === 'function') {
          childProps.onClick();
        }
      },
    });
  });

  return (
    <div
      ref={containerRef}
      className={className}
      role={role}
      aria-label={ariaLabel}
      aria-orientation={orientation === 'both' ? undefined : orientation}
    >
      {enhancedChildren}
    </div>
  );
}

// Specialized component for navigation menus
export function KeyboardNavigationMenu({
  children,
  className = '',
  ariaLabel = 'Navigation menu',
  onSelectionChange,
  defaultSelectedIndex = 0,
}: Omit<KeyboardNavigationListProps, 'role' | 'orientation'>) {
  return (
    <KeyboardNavigationList
      role="menubar"
      orientation="horizontal"
      className={className}
      ariaLabel={ariaLabel}
      onSelectionChange={onSelectionChange}
      defaultSelectedIndex={defaultSelectedIndex}
    >
      {children}
    </KeyboardNavigationList>
  );
}

// Specialized component for radio groups
export function KeyboardNavigationRadioGroup({
  children,
  className = '',
  ariaLabel,
  onSelectionChange,
  defaultSelectedIndex = 0,
  name,
}: Omit<KeyboardNavigationListProps, 'role'> & { name?: string }) {
  return (
    <KeyboardNavigationList
      role="radiogroup"
      className={className}
      ariaLabel={ariaLabel}
      onSelectionChange={onSelectionChange}
      defaultSelectedIndex={defaultSelectedIndex}
    >
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;

        const childProps = child.props as any;

        return cloneElement(child as any, {
          ...(childProps || {}),
          role: 'radio',
          'aria-checked': index === defaultSelectedIndex,
          name: name,
        });
      })}
    </KeyboardNavigationList>
  );
}

export default KeyboardNavigationList;
