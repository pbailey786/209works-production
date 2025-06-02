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
  ChevronRight
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
  onSave,
  onViewDetails,
  className
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
        "relative bg-white rounded-2xl border border-gray-200 p-6 transition-all duration-300",
        "hover:shadow-xl hover:border-gray-300 cursor-pointer group",
        isFeatured && "ring-2 ring-yellow-400 ring-opacity-50",
        className
      )}
      onClick={onViewDetails}
    >
      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            <Star className="w-3 h-3" />
            Featured
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#2d4a3e] transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium truncate">{company}</span>
          </div>
        </div>
        
        {/* Save Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          disabled={isSaving}
          className={cn(
            "h-10 w-10 rounded-full transition-all duration-200",
            saved
              ? "text-[#2d4a3e] bg-[#9fdf9f]/20 hover:bg-[#9fdf9f]/30"
              : "text-gray-400 hover:text-[#2d4a3e] hover:bg-[#2d4a3e]/5"
          )}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
          )}
        </Button>
      </div>

      {/* Job Details */}
      <div className="space-y-3 mb-4">
        {/* Location and Remote */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
          {isRemote && (
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              Remote
            </Badge>
          )}
        </div>

        {/* Job Type, Experience, Salary */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-[#2d4a3e]/20 text-[#2d4a3e]">
            {type}
          </Badge>
          {experienceLevel && (
            <Badge variant="outline" className="border-[#ff6b35]/20 text-[#ff6b35]">
              {experienceLevel}
            </Badge>
          )}
          {salary && (
            <div className="flex items-center gap-1 text-sm font-medium text-[#9fdf9f]">
              <DollarSign className="w-4 h-4" />
              <span>{salary}</span>
            </div>
          )}
        </div>

        {/* Posted Date */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>Posted {formatPostedDate(postedAt)}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 text-sm leading-relaxed line-clamp-3 mb-6">
        {description}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {onViewDetails && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="flex-1 bg-[#2d4a3e] hover:bg-[#1d3a2e] text-white font-medium"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        )}
        
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            console.log('Apply button clicked:', { id, title, applyUrl });
            if (applyUrl === '#' || !applyUrl) {
              alert('Apply URL not available for this job');
              return;
            }
            window.open(applyUrl, '_blank', 'noopener,noreferrer');
          }}
          className={cn(
            "border-gray-300 hover:border-[#2d4a3e] hover:bg-[#2d4a3e]/5 hover:text-[#2d4a3e]",
            onViewDetails ? "px-4" : "flex-1"
          )}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {onViewDetails ? "Apply" : "View & Apply"}
        </Button>
      </div>

      {/* Hover Effect Arrow */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ 
          opacity: isHovered ? 1 : 0, 
          x: isHovered ? 0 : -10 
        }}
        transition={{ duration: 0.2 }}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#2d4a3e]"
      >
        <ChevronRight className="w-5 h-5" />
      </motion.div>
    </motion.article>
  );
} 