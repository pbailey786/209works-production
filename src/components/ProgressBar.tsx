import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, color = 'bg-blue-600', className = '' }) => (
  <div className={`w-full bg-gray-200 rounded h-4 ${className}`}>
    <div
      className={`h-4 rounded ${color} transition-all duration-300`}
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    ></div>
    <span className="block text-xs text-gray-700 mt-1 text-right">{Math.round(value)}%</span>
  </div>
);

export default ProgressBar; 