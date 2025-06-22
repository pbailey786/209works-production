import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  message?: string;
  progress?: number; // 0-100 for progress bar
  className?: string;
  color?: 'primary' | 'secondary' | 'white' | 'gray';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colorClasses = {
  primary: 'text-blue-600',
  secondary: 'text-purple-600',
  white: 'text-white',
  gray: 'text-gray-400',
};

export default function LoadingSpinner({
  size = 'md',
  variant = 'spinner',
  message,
  progress,
  className = '',
  color = 'primary',
}: LoadingSpinnerProps) {
  const baseClasses = `${sizeClasses[size]} ${colorClasses[color]} ${className}`;

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className={`h-2 w-2 rounded-full bg-current`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <motion.div
            className={`${baseClasses} rounded-full bg-current`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
        );

      case 'skeleton':
        return (
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            <div className="h-4 w-5/6 rounded bg-gray-200"></div>
          </div>
        );

      default: // spinner
        return (
          <motion.div
            className={`${baseClasses} rounded-full border-2 border-current border-t-transparent`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderSpinner()}

      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-2 text-sm ${colorClasses[color]} text-center`}
        >
          {message}
        </motion.p>
      )}

      {progress !== undefined && (
        <div className="mt-3 w-full max-w-xs">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <motion.div
              className="h-2 rounded-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
