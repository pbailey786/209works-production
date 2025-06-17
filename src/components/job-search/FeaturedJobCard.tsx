import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  DollarSign,
  Bookmark,
  ExternalLink,
  Building2,
  Calendar,
  Eye,
  ChevronRight,
  CheckCircle,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FeaturedBadgeFloating } from './FeaturedJobBadge';

interface FeaturedJobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  postedAt: string;
  description: string;
  applyUrl: string;
  isFeatured?: boolean;
  isRemote?: boolean;
  experienceLevel?: string;
  saved?: boolean;
  applied?: boolean;
  applicationStatus?: 'pending' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  appliedAt?: string;
  onSave?: () => void;
  onViewDetails?: () => void;
  className?: string;
  
  // Analytics props (optional)
  viewCount?: number;
  applicantCount?: number;
}

export default function FeaturedJobCard({
  id,
  title,
  company,
  location,
  type,
  salary,
  postedAt,
  description,
  applyUrl,
  isFeatured = false,
  isRemote = false,
  experienceLevel,
  saved = false,
  applied = false,
  applicationStatus,
  appliedAt,
  onSave,
  onViewDetails,
  className,
  viewCount,
  applicantCount,
}: FeaturedJobCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave || isSaving || saved) return;

    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error('Failed to save job:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatPostedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        'relative rounded-2xl border bg-white p-6 transition-all duration-300',
        'group cursor-pointer hover:shadow-2xl',
        
        // Featured job styling
        isFeatured ? [
          'border-yellow-300 bg-gradient-to-br from-yellow-50 via-white to-orange-50',
          'ring-2 ring-yellow-400 ring-opacity-30',
          'shadow-lg shadow-yellow-100',
          'hover:ring-opacity-50 hover:shadow-yellow-200',
        ] : [
          'border-gray-200 hover:border-gray-300 hover:shadow-xl',
        ],
        
        className
      )}
      onClick={onViewDetails}
    >
      {/* Featured Badge */}
      {isFeatured && (
        <FeaturedBadgeFloating 
          className="animate-pulse hover:animate-none"
        />
      )}

      {/* Applied Badge */}
      {applied && (
        <div className={`absolute ${isFeatured ? '-left-2 -top-2' : '-right-2 -top-2'} z-10`}>
          <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-green-500 to-green-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
            <CheckCircle className="h-3 w-3" />
            Applied
          </div>
        </div>
      )}

      {/* Premium Visual Indicator for Featured Jobs */}
      {isFeatured && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/5 via-transparent to-orange-400/5 pointer-events-none" />
      )}

      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className={cn(
            'mb-2 line-clamp-2 text-xl font-bold transition-colors group-hover:text-[#2d4a3e]',
            isFeatured ? 'text-gray-900' : 'text-gray-900'
          )}>
            {title}
          </h3>
          <div className="mb-2 flex items-center gap-2 text-gray-600">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate font-medium">{company}</span>
            {isFeatured && (
              <Badge 
                variant="secondary" 
                className="bg-yellow-100 text-yellow-800 border-yellow-200"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Boosted
              </Badge>
            )}
          </div>
        </div>

        {/* Save Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={e => {
            e.stopPropagation();
            handleSave();
          }}
          disabled={isSaving}
          className={cn(
            'h-10 w-10 rounded-full transition-all duration-200',
            saved
              ? 'bg-[#9fdf9f]/20 text-[#2d4a3e] hover:bg-[#9fdf9f]/30'
              : 'text-gray-400 hover:bg-[#2d4a3e]/5 hover:text-[#2d4a3e]'
          )}
        >
          {isSaving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
          )}
        </Button>
      </div>

      {/* Job Details */}
      <div className="mb-4 space-y-3">
        {/* Location and Remote */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
          {isRemote && (
            <Badge
              variant="secondary"
              className="border-green-200 bg-green-50 text-green-700"
            >
              Remote
            </Badge>
          )}
        </div>

        {/* Job Type, Experience, Salary */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              isFeatured 
                ? "border-orange-200 bg-orange-50 text-orange-700"
                : "border-[#2d4a3e]/20 text-[#2d4a3e]"
            )}
          >
            {type}
          </Badge>
          {experienceLevel && (
            <Badge
              variant="outline"
              className="border-[#ff6b35]/20 text-[#ff6b35]"
            >
              {experienceLevel}
            </Badge>
          )}
          {salary && (
            <div className="flex items-center gap-1 text-sm font-medium text-green-600">
              <DollarSign className="h-4 w-4" />
              <span>{salary}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="line-clamp-3 text-sm text-gray-600 leading-relaxed">
          {description}
        </p>

        {/* Analytics for Featured Jobs */}
        {isFeatured && (viewCount || applicantCount) && (
          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
            {viewCount && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{viewCount} views</span>
              </div>
            )}
            {applicantCount && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{applicantCount} applied</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>Posted {formatPostedDate(postedAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Apply Button for Featured Jobs */}
          {isFeatured && (
            <Button
              size="sm"
              variant="outline"
              onClick={e => {
                e.stopPropagation();
                window.open(applyUrl, '_blank', 'noopener,noreferrer');
              }}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              Quick Apply
            </Button>
          )}

          {/* View Details Button */}
          <Button
            size="sm"
            onClick={e => {
              e.stopPropagation();
              if (onViewDetails) onViewDetails();
            }}
            className={cn(
              isFeatured 
                ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                : "bg-[#2d4a3e] hover:bg-[#1d3a2e] text-white"
            )}
          >
            View Details
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Subtle animation for featured jobs */}
      {isFeatured && isHovered && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/10 via-transparent to-orange-400/10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.article>
  );
}