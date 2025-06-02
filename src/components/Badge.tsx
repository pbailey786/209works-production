import React from 'react';

interface BadgeProps {
  color?: 'default' | 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
}

const colorStyles = {
  default: 'bg-gray-200 text-gray-800',
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
};

export const Badge: React.FC<BadgeProps> = ({ color = 'default', children, className = '' }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colorStyles[color]} ${className}`.trim()}>
    {children}
  </span>
);

export default Badge; 