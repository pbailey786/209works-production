import React, { useState, useRef, useEffect } from 'react';
import { useKeyboardNavigation, useFocusRestore } from '@/hooks/useKeyboardNavigation';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  disabled = false,
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const { saveFocus, restoreFocus } = useFocusRestore();

  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Reset active index when options change
  useEffect(() => {
    setActiveIndex(-1);
  }, [options]);

  const handleToggle = () => {
    if (disabled) return;
    
    if (!open) {
      saveFocus();
      setOpen(true);
      // Set active index to current selection or first option
      const currentIndex = options.findIndex(opt => opt.value === value);
      setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    } else {
      setOpen(false);
      setActiveIndex(-1);
      restoreFocus();
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setActiveIndex(-1);
    buttonRef.current?.focus();
  };

  const { handleKeyDown: handleButtonKeyDown } = useKeyboardNavigation({
    onEnter: handleToggle,
    onSpace: handleToggle,
    onArrowDown: () => {
      if (!open) {
        handleToggle();
      } else {
        const nextIndex = Math.min(activeIndex + 1, options.length - 1);
        setActiveIndex(nextIndex);
      }
    },
    onArrowUp: () => {
      if (open) {
        const prevIndex = Math.max(activeIndex - 1, 0);
        setActiveIndex(prevIndex);
      }
    },
    onEscape: () => {
      if (open) {
        setOpen(false);
        setActiveIndex(-1);
        buttonRef.current?.focus();
      }
    },
    onHome: () => {
      if (open) {
        setActiveIndex(0);
      }
    },
    onEnd: () => {
      if (open) {
        setActiveIndex(options.length - 1);
      }
    },
  });

  const { handleKeyDown: handleListKeyDown } = useKeyboardNavigation({
    onEnter: () => {
      if (activeIndex >= 0 && activeIndex < options.length) {
        handleSelect(options[activeIndex].value);
      }
    },
    onSpace: () => {
      if (activeIndex >= 0 && activeIndex < options.length) {
        handleSelect(options[activeIndex].value);
      }
    },
    onArrowDown: () => {
      const nextIndex = Math.min(activeIndex + 1, options.length - 1);
      setActiveIndex(nextIndex);
    },
    onArrowUp: () => {
      const prevIndex = Math.max(activeIndex - 1, 0);
      setActiveIndex(prevIndex);
    },
    onEscape: () => {
      setOpen(false);
      setActiveIndex(-1);
      buttonRef.current?.focus();
    },
    onHome: () => {
      setActiveIndex(0);
    },
    onEnd: () => {
      setActiveIndex(options.length - 1);
    },
  });

  // Focus management for list items
  useEffect(() => {
    if (open && activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, open]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`w-full px-4 py-2 text-left bg-white border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
        }`}
        onClick={handleToggle}
        onKeyDown={handleButtonKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || 'Select an option'}
        aria-describedby={open ? 'dropdown-list' : undefined}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id="dropdown-list"
          className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto"
          role="listbox"
          aria-label="Options"
          onKeyDown={handleListKeyDown}
          tabIndex={-1}
        >
          {options.map((opt, index) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`px-4 py-2 cursor-pointer transition-colors ${
                index === activeIndex
                  ? 'bg-blue-100 text-blue-900'
                  : opt.value === value
                  ? 'bg-blue-50 font-semibold text-blue-900'
                  : 'text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => handleSelect(opt.value)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown; 