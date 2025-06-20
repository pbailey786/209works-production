'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  MoreHorizontal,
  ExternalLink,
  Loader2
} from 'lucide-react';

// Metric Card Component (like the top cards in Digesto)
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  onClick?: () => void;
  className?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  onClick,
  className,
  color = 'blue'
}: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200',
    red: 'bg-red-50 border-red-200',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md touch-manipulation",
        colorClasses[color],
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 flex-shrink-0" />
                ) : (
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1 flex-shrink-0" />
                )}
                <span className={cn(
                  "text-xs sm:text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.value}%
                </span>
                {trend.label && (
                  <span className="text-xs sm:text-sm text-gray-500 ml-1 truncate">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          <div className={cn("p-2 sm:p-3 rounded-full flex-shrink-0", iconColorClasses[color])}>
            <div className="w-5 h-5 sm:w-6 sm:h-6">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Widget Card Component (for the larger content areas)
interface WidgetCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

export function WidgetCard({
  title,
  subtitle,
  children,
  actions,
  className,
  headerActions
}: WidgetCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        {headerActions && (
          <div className="flex items-center space-x-2">
            {headerActions}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {children}
        {actions && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Usage Meter Component (like the circular progress in Digesto)
interface UsageMeterProps {
  title: string;
  used: number;
  total: number;
  unit?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple';
  showUpgrade?: boolean;
  onUpgrade?: () => void;
}

export function UsageMeter({
  title,
  used,
  total,
  unit = '',
  color = 'blue',
  showUpgrade = false,
  onUpgrade
}: UsageMeterProps) {
  const percentage = Math.round((used / total) * 100);
  
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
  };

  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={`${percentage * 2.51} 251`}
            className={colorClasses[color]}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-2xl font-bold", colorClasses[color])}>
            {percentage}%
          </span>
        </div>
      </div>
      <div className="mt-3">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">
          {used} of {total} {unit} used
        </p>
        {showUpgrade && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={onUpgrade}
          >
            Upgrade
          </Button>
        )}
      </div>
    </div>
  );
}

// Activity Item Component
interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  icon?: React.ReactNode;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export function ActivityItem({
  title,
  description,
  time,
  icon,
  badge
}: ActivityItemProps) {
  return (
    <div className="flex items-start space-x-3 py-3">
      {icon && (
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 sm:w-4 sm:h-4">
            {icon}
          </div>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">{title}</p>
          {badge && (
            <Badge variant={badge.variant} className="text-xs flex-shrink-0">
              {badge.text}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  );
}

// Quick Action Button
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'secondary';
}

export function QuickAction({
  title,
  description,
  icon,
  onClick,
  variant = 'default'
}: QuickActionProps) {
  const variantClasses = {
    default: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
    primary: 'border-[#ff6b35] bg-[#ff6b35]/5 hover:bg-[#ff6b35]/10',
    secondary: 'border-[#2d4a3e] bg-[#2d4a3e]/5 hover:bg-[#2d4a3e]/10',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 sm:p-4 border rounded-lg text-left transition-all hover:shadow-sm touch-manipulation active:scale-95",
        variantClasses[variant]
      )}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-5 h-5 sm:w-6 sm:h-6">
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">{title}</h3>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </div>
    </button>
  );
}

// Stats Grid Component
interface StatsGridProps {
  stats: Array<{
    label: string;
    value: string | number;
    change?: {
      value: number;
      isPositive: boolean;
    };
  }>;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stat.value}</div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{stat.label}</div>
          {stat.change && (
            <div className="flex items-center justify-center mt-1">
              {stat.change.isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1 flex-shrink-0" />
              )}
              <span className={cn(
                "text-xs",
                stat.change.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {stat.change.value}%
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Loading Skeleton Components
export function MetricCardSkeleton() {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
            <div className="flex items-center mt-2">
              <Skeleton className="h-3 w-3 mr-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <Skeleton className="w-12 h-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function WidgetCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivityItemSkeleton() {
  return (
    <div className="flex items-start space-x-3 py-3">
      <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-32 flex-1" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-48 mt-1" />
        <Skeleton className="h-3 w-20 mt-1" />
      </div>
    </div>
  );
}

// Error State Components
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto mb-4 h-12 w-12 text-red-500">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}

// Loading State Component
export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="text-center py-8">
      <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
