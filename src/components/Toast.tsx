import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  open: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

const typeStyles = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-yellow-500 text-white',
};

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  open,
  onClose,
  autoHideDuration = 3000,
}) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded px-4 py-3 shadow-lg ${typeStyles[type]}`}
      role="alert"
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-lg font-bold text-white/80 hover:text-white focus:outline-none"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
