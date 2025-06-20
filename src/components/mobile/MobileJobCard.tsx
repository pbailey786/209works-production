'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Bookmark, 
  BookmarkCheck,
  ExternalLink,
  Building,
  Calendar,
  Users,
  Zap,
  Star,
  Share,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType: string;
  experienceLevel?: string;
  postedAt: string;
  featured?: boolean;
  urgent?: boolean;
  remote?: boolean;
  skills?: string[];
  benefits?: string[];
  companyLogo?: string;
  applicationCount?: number;
  viewCount?: number;
}

interface MobileJobCardProps {
  job: Job;
  onSave?: (jobId: string) => void;
  onUnsave?: (jobId: string) => void;
  isSaved?: boolean;
  showFullDescription?: boolean;
  className?: string;
}

export default function MobileJobCard({
  job,
  onSave,
  onUnsave,
  isSaved = false,
  showFullDescription = false,
  className = '',
}: MobileJobCardProps) {
  const [isExpanded, setIsExpanded] = useState(showFullDescription);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveToggle = async () => {
    setIsLoading(true);
    try {
      if (isSaved) {
        await onUnsave?.(job.id);
        toast({
          title: 'Job removed',
          description: 'Job removed from your saved list',
        });
      } else {
        await onSave?.(job.id);
        toast({
          title: 'Job saved',
          description: 'Job added to your saved list',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update saved job',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${job.title} at ${job.company}`,
      text: `Check out this job opportunity: ${job.title} at ${job.company} in ${job.location}`,
      url: `${window.location.origin}/jobs/${job.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: 'Link copied',
          description: 'Job link copied to clipboard',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return null;
  };

  const truncateDescription = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className={`relative overflow-hidden ${job.featured ? 'ring-2 ring-yellow-400' : ''}`}>
        {/* Featured/Urgent badges */}
        {(job.featured || job.urgent) && (
          <div className="absolute top-3 right-3 z-10 flex gap-1">
            {job.featured && (
              <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {job.urgent && (
              <Badge className="bg-red-500 text-white text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Urgent
              </Badge>
            )}
          </div>
        )}

        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {/* Company logo placeholder */}
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {job.companyLogo ? (
                <img 
                  src={job.companyLogo} 
                  alt={job.company}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Building className="h-6 w-6 text-gray-400" />
              )}
            </div>

            {/* Job info */}
            <div className="flex-1 min-w-0">
              <Link href={`/jobs/${job.id}`}>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 hover:text-green-600 transition-colors">
                  {job.title}
                </h3>
              </Link>
              <p className="text-sm text-gray-600 mb-1">{job.company}</p>
              
              {/* Location and remote */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                <span>{job.location}</span>
                {job.remote && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    Remote
                  </Badge>
                )}
              </div>
            </div>

            {/* Save button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveToggle}
              disabled={isLoading}
              className="p-2 h-8 w-8"
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4 text-green-600" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Job details */}
          <div className="space-y-2 mb-3">
            {/* Salary and job type */}
            <div className="flex items-center gap-3 text-xs">
              {formatSalary(job.salaryMin, job.salaryMax) && (
                <div className="flex items-center gap-1 text-green-600">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-medium">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                </div>
              )}
              
              <Badge variant="secondary" className="text-xs">
                {job.jobType}
              </Badge>
              
              {job.experienceLevel && (
                <Badge variant="outline" className="text-xs">
                  {job.experienceLevel}
                </Badge>
              )}
            </div>

            {/* Description */}
            <div className="text-sm text-gray-700">
              {isExpanded ? (
                <div>
                  <p className="mb-2">{job.description}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="text-xs text-green-600 p-0 h-auto"
                  >
                    Show less
                  </Button>
                </div>
              ) : (
                <div>
                  <p>{truncateDescription(job.description)}</p>
                  {job.description.length > 120 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(true)}
                      className="text-xs text-green-600 p-0 h-auto mt-1"
                    >
                      Read more
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {job.skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{job.skills.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            {/* Posted time and stats */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(job.postedAt), { addSuffix: true })}</span>
              </div>
              
              {job.applicationCount && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{job.applicationCount} applied</span>
                </div>
              )}
              
              {job.viewCount && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{job.viewCount} views</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="p-2 h-8 w-8"
              >
                <Share className="h-3 w-3" />
              </Button>
              
              <Link href={`/jobs/${job.id}`}>
                <Button size="sm" className="text-xs px-3 py-1 h-7">
                  View Job
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
