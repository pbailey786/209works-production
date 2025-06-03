import React from 'react';

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const typeStyles = {
  success: 'bg-green-100 text-green-800 border-green-300',
  error: 'bg-red-100 text-red-800 border-red-300',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  info: 'bg-blue-100 text-blue-800 border-blue-300',
};

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className = '',
}) => {
  const getRole = () => {
    switch (type) {
      case 'error':
        return 'alert';
      case 'warning':
        return 'alert';
      default:
        return 'status';
    }
  };

  return (
    <div
      className={`mb-4 rounded border-l-4 p-4 ${typeStyles[type]} ${className}`.trim()}
      role={getRole()}
      aria-live={
        type === 'error' || type === 'warning' ? 'assertive' : 'polite'
      }
    >
      {title && <h3 className="mb-1 font-semibold">{title}</h3>}
      <div>{children}</div>
    </div>
  );
};

export default Alert;
