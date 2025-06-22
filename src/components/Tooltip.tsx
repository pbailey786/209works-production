import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = 'top',
  children,
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const getPosition = () => {
    switch (placement) {
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      ref={ref}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
    >
      {children}
      {visible && (
        <div
          className={`pointer-events-none absolute z-20 rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-100 shadow transition-opacity duration-150 ${getPosition()}`}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
