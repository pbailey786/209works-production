import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({
    className,
    value = 0,
    max = 100,
    size = 'md',
    variant = 'default',
    showLabel = false,
    label,
    ...props
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4',
    };

    const variantClasses = {
      default: 'bg-primary',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
    };

    return (
      <div className="w-full space-y-2">
        {(showLabel || label) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">{label}</span>
            <span className="text-gray-500">{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          ref={ref}
          className={cn(
            "relative w-full overflow-hidden rounded-full bg-gray-200",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full w-full flex-1 transition-all duration-300 ease-in-out",
              variantClasses[variant]
            )}
            style={{ transform: `translateX(-${100 - percentage}%)` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
export default Progress;