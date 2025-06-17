import React from 'react';
import { Star, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedJobBadgeProps {
  className?: string;
  variant?: 'default' | 'compact' | 'floating';
  style?: 'gradient' | 'solid' | 'outline';
  showIcon?: boolean;
  text?: string;
}

export default function FeaturedJobBadge({
  className,
  variant = 'default',
  style = 'gradient',
  showIcon = true,
  text = 'Featured',
}: FeaturedJobBadgeProps) {
  const iconMap = {
    star: Star,
    zap: Zap,
    crown: Crown,
  };

  const IconComponent = Star; // Using Star as the primary icon

  const baseClasses = 'inline-flex items-center justify-center font-bold text-white shadow-lg transition-all duration-200';
  
  const variantClasses = {
    default: 'px-3 py-1 text-xs rounded-full',
    compact: 'px-2 py-0.5 text-xs rounded-md',
    floating: 'px-3 py-1 text-xs rounded-full absolute -right-2 -top-2 z-10 transform hover:scale-105',
  };

  const styleClasses = {
    gradient: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 hover:from-yellow-500 hover:to-orange-600',
    solid: 'bg-yellow-500 hover:bg-yellow-600',
    outline: 'border-2 border-yellow-400 bg-white text-yellow-600 hover:bg-yellow-50',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        styleClasses[style],
        className
      )}
      role="badge"
      aria-label={`${text} job posting`}
    >
      {showIcon && (
        <IconComponent 
          className={cn(
            'flex-shrink-0',
            text ? 'mr-1' : '',
            variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4'
          )} 
        />
      )}
      {text && <span>{text}</span>}
    </div>
  );
}

// Pre-built variations for common use cases
export const FeaturedBadgeFloating = (props: Omit<FeaturedJobBadgeProps, 'variant'>) => (
  <FeaturedJobBadge {...props} variant="floating" />
);

export const FeaturedBadgeCompact = (props: Omit<FeaturedJobBadgeProps, 'variant'>) => (
  <FeaturedJobBadge {...props} variant="compact" />
);

export const FeaturedBadgeOutline = (props: Omit<FeaturedJobBadgeProps, 'style'>) => (
  <FeaturedJobBadge {...props} style="outline" />
);