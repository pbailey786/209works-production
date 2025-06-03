import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'bg-blue-600',
  className = '',
}) => (
  <div className={`h-4 w-full rounded bg-gray-200 ${className}`}>
    <div
      className={`h-4 rounded ${color} transition-all duration-300`}
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    ></div>
    <span className="mt-1 block text-right text-xs text-gray-700">
      {Math.round(value)}%
    </span>
  </div>
);

export default ProgressBar;
