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
  Star,
  Eye,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EnhancedJobCardProps {
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
}

export default function EnhancedJobCard({
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
}: EnhancedJobCardProps) {
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
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        'relative rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300',
        'group cursor-pointer hover:border-gray-300 hover:shadow-xl',
        isFeatured && 'ring-2 ring-yellow-400 ring-opacity-50',
        className
      )}
      onClick={onViewDetails}
    >
      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute -right-2 -top-2 z-10">
          <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            <Star className="h-3 w-3" />
            Featured
          </div>
        </div>
      )}

      {/* Applied Badge */}
      {applied && (
        <div className={`absolute ${isFeatured ? '-right-2 top-6' : '-right-2 -top-2'} z-10`}>
          <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-green-500 to-green-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
            <CheckCircle className="h-3 w-3" />
            Applied
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="mb-2 line-clamp-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-[#2d4a3e]">
            {title}
          </h3>
          <div className="mb-2 flex items-center gap-2 text-gray-600">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate font-medium">{company}</span>
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
            className="border-[#2d4a3e]/20 text-[#2d4a3e]"
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
            <div className="flex items-center gap-1 text-sm font-medium text-[#9fdf9f]">
              <DollarSign className="h-4 w-4" />
              <span>{salary}</span>
            </div>
          )}
        </div>

        {/* Posted Date */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>Posted {formatPostedDate(postedAt)}</span>
        </div>
      </div>

      {/* Description */}
      <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-700">
        {description}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {onViewDetails && (
          <Button
            onClick={e => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="flex-1 bg-[#2d4a3e] font-medium text-white hover:bg-[#1d3a2e]"
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
        )}

        <Button
          variant="outline"
          onClick={e => {
            e.stopPropagation();
            console.log('Apply button clicked:', { id, title, applyUrl });
            if (applyUrl === '#' || !applyUrl) {
              alert('Apply URL not available for this job');
              return;
            }
            window.open(applyUrl, '_blank', 'noopener,noreferrer');
          }}
          className={cn(
            'border-gray-300 hover:border-[#2d4a3e] hover:bg-[#2d4a3e]/5 hover:text-[#2d4a3e]',
            onViewDetails ? 'px-4' : 'flex-1'
          )}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          {onViewDetails ? 'Apply' : 'View & Apply'}
        </Button>
      </div>

      {/* Hover Effect Arrow */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          x: isHovered ? 0 : -10,
        }}
        transition={{ duration: 0.2 }}
        className="absolute right-4 top-1/2 -translate-y-1/2 transform text-[#2d4a3e]"
      >
        <ChevronRight className="h-5 w-5" />
      </motion.div>
    </motion.article>
  );
}
