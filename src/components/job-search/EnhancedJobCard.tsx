import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, DollarSign, Briefcase, Heart, ExternalLink, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface EnhancedJobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  postedAt: string;
  description: string;
  featured?: boolean;
  urgent?: boolean;
  matchScore?: number;
  saved?: boolean;
  applied?: boolean;
  companyLogo?: string;
  benefits?: string[];
  onSave?: () => void;
  onApply?: () => void;
  onViewDetails?: () => void;
}

export default function EnhancedJobCard({
  id,
  title,
  company,
  location,
  salary,
  type,
  postedAt,
  description,
  featured = false,
  urgent = false,
  matchScore,
  saved = false,
  applied = false,
  companyLogo,
  benefits = [],
  onSave,
  onApply,
  onViewDetails
}: EnhancedJobCardProps) {
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
    <Card className={`group hover:shadow-xl transition-all duration-300 ${
      featured ? 'ring-2 ring-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5' : ''
    } ${urgent ? 'border-orange-200 bg-orange-50/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {companyLogo && (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img src={companyLogo} alt={company} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  <Link href={`/jobs/${id}`} className="hover:underline">
                    {title}
                  </Link>
                </h3>

                {featured && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}

                {urgent && (
                  <Badge variant="destructive" className="bg-orange-100 text-orange-700 border-orange-200">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Urgent
                  </Badge>
                )}

                {matchScore && matchScore > 80 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {matchScore}% Match
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground font-medium mb-1">{company}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{location}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span>{type}</span>
                </div>

                {salary && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{salary}</span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatPostedDate(postedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            className={`${saved ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500 flex-shrink-0`}
          >
            <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </p>

        {benefits.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {benefits.slice(0, 3).map((benefit, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {benefit}
              </Badge>
            ))}
            {benefits.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{benefits.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/jobs/${id}`}>
              <Button variant="outline" size="sm" className="group/btn">
                View Details
                <ExternalLink className="h-3 w-3 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
              </Button>
            </Link>

            {applied && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Applied
              </Badge>
            )}
          </div>

          <Button
            size="sm"
            onClick={onApply}
            disabled={applied}
            className={applied ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {applied ? 'Applied' : 'Quick Apply'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
