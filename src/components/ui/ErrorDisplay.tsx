import React from 'react';
import { motion } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  WifiIcon,
  ClockIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface ErrorDisplayProps {
  error: string | Error | null;
  type?: 'error' | 'warning' | 'network' | 'timeout' | 'validation';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'card' | 'modal' | 'toast';
  canRetry?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  className?: string;
  showIcon?: boolean;
  maxRetries?: number;
  currentAttempt?: number;
}

const typeConfig = {
  error: {
    icon: XCircleIcon,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-500',
    buttonColor: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-500',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
  },
  network: {
    icon: WifiIcon,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-500',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
  },
  timeout: {
    icon: ClockIcon,
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    iconColor: 'text-orange-500',
    buttonColor: 'bg-orange-600 hover:bg-orange-700',
  },
  validation: {
    icon: InformationCircleIcon,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-800',
    iconColor: 'text-purple-500',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
  },
};

const sizeClasses = {
  sm: {
    padding: 'p-3',
    iconSize: 'w-4 h-4',
    textSize: 'text-sm',
    buttonSize: 'px-3 py-1 text-xs',
  },
  md: {
    padding: 'p-4',
    iconSize: 'w-5 h-5',
    textSize: 'text-sm',
    buttonSize: 'px-4 py-2 text-sm',
  },
  lg: {
    padding: 'p-6',
    iconSize: 'w-6 h-6',
    textSize: 'text-base',
    buttonSize: 'px-6 py-3 text-base',
  },
};

const variantClasses = {
  inline: 'rounded-md border',
  card: 'rounded-lg border shadow-sm',
  modal: 'rounded-lg border shadow-lg',
  toast: 'rounded-md border shadow-md',
};

export default function ErrorDisplay({
  error,
  type = 'error',
  size = 'md',
  variant = 'card',
  canRetry = false,
  onRetry,
  onDismiss,
  retryLabel = 'Try Again',
  className = '',
  showIcon = true,
  maxRetries = 3,
  currentAttempt = 0,
}: ErrorDisplayProps) {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;
  const config = typeConfig[type];
  const sizeConfig = sizeClasses[size];
  const variantClass = variantClasses[variant];

  const getErrorTitle = () => {
    switch (type) {
      case 'network':
        return 'Connection Error';
      case 'timeout':
        return 'Request Timeout';
      case 'validation':
        return 'Validation Error';
      case 'warning':
        return 'Warning';
      default:
        return 'Error';
    }
  };

  const getHelpfulMessage = () => {
    switch (type) {
      case 'network':
        return 'Please check your internet connection and try again.';
      case 'timeout':
        return 'The request took too long to complete. Please try again.';
      case 'validation':
        return 'Please check your input and try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const shouldShowRetry = canRetry && onRetry && currentAttempt < maxRetries;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        ${config.bgColor} 
        ${config.borderColor} 
        ${variantClass} 
        ${sizeConfig.padding}
        ${className}
      `}
    >
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            <config.icon className={`${sizeConfig.iconSize} ${config.iconColor}`} />
          </div>
        )}
        
        <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
          <h3 className={`font-medium ${config.textColor} ${sizeConfig.textSize}`}>
            {getErrorTitle()}
          </h3>
          
          <div className={`mt-1 ${config.textColor} ${sizeConfig.textSize}`}>
            <p>{errorMessage}</p>
            {type !== 'validation' && (
              <p className="mt-1 text-xs opacity-75">{getHelpfulMessage()}</p>
            )}
          </div>

          {(shouldShowRetry || onDismiss) && (
            <div className="mt-3 flex items-center gap-2">
              {shouldShowRetry && (
                <button
                  onClick={onRetry}
                  className={`
                    inline-flex items-center 
                    ${config.buttonColor} 
                    text-white 
                    ${sizeConfig.buttonSize} 
                    rounded-md 
                    font-medium 
                    transition-colors
                    focus:outline-none 
                    focus:ring-2 
                    focus:ring-offset-2 
                    focus:ring-offset-white
                  `}
                >
                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                  {retryLabel}
                  {maxRetries > 1 && (
                    <span className="ml-1 text-xs opacity-75">
                      ({currentAttempt + 1}/{maxRetries})
                    </span>
                  )}
                </button>
              )}
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`
                    ${sizeConfig.buttonSize} 
                    text-gray-600 
                    hover:text-gray-800 
                    transition-colors
                    focus:outline-none
                  `}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}

          {currentAttempt >= maxRetries && (
            <div className="mt-2 text-xs opacity-75">
              Maximum retry attempts reached. Please contact support if the problem persists.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 