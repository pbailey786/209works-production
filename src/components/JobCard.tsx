import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, DollarSign, Briefcase, Heart, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  postedAt: string;
  description: string;
  featured?: boolean;
  saved?: boolean;
  onSave?: () => void;
  onViewDetails?: () => void;
}

export default function JobCard({
  id,
  title,
  company,
  location,
  salary,
  type,
  postedAt,
  description,
  featured = false,
  saved = false,
  onSave,
  onViewDetails
}: JobCardProps) {
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
    <Card className={`group hover:shadow-lg transition-all duration-300 ${featured ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                <Link href={`/jobs/${id}`}>
                  {title}
                </Link>
              </h3>
              {featured && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Featured
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground font-medium">{company}</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            className={`${saved ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500`}
          >
            <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
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

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between">
          <Link href={`/jobs/${id}`}>
            <Button variant="outline" size="sm" className="group/btn">
              View Details
              <ExternalLink className="h-3 w-3 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
            </Button>
          </Link>

          <Button size="sm" onClick={onViewDetails}>
            Quick Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
