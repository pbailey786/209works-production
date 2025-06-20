'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Calendar,
  User,
  Building2,
  Mail,
  Phone,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'status_change' | 'employer_view' | 'message' | 'interview_scheduled' | 'note_added';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  actor?: {
    name: string;
    role: 'system' | 'employer' | 'jobseeker';
  };
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    message?: string;
    interviewDate?: string;
    interviewType?: string;
  };
}

interface ApplicationTimelineProps {
  applicationId: string;
  currentStatus: string;
  jobTitle: string;
  company: string;
  appliedAt: string;
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Application Submitted',
  },
  reviewing: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Under Review',
  },
  interview: {
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Interview Scheduled',
  },
  offer: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Offer Extended',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Not Selected',
  },
  withdrawn: {
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Application Withdrawn',
  },
};

export default function ApplicationTimeline({
  applicationId,
  currentStatus,
  jobTitle,
  company,
  appliedAt,
}: ApplicationTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, [applicationId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/applications/${applicationId}/timeline`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }

      const data = await response.json();
      setTimeline(data.timeline || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'status_change':
        const statusConfig = STATUS_CONFIG[event.metadata?.newStatus as keyof typeof STATUS_CONFIG];
        return statusConfig?.icon || Clock;
      case 'employer_view':
        return Eye;
      case 'message':
        return MessageSquare;
      case 'interview_scheduled':
        return Calendar;
      case 'note_added':
        return FileText;
      default:
        return Clock;
    }
  };

  const getEventColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'status_change':
        const statusConfig = STATUS_CONFIG[event.metadata?.newStatus as keyof typeof STATUS_CONFIG];
        return statusConfig?.color || 'text-gray-600';
      case 'employer_view':
        return 'text-blue-600';
      case 'message':
        return 'text-green-600';
      case 'interview_scheduled':
        return 'text-purple-600';
      case 'note_added':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex space-x-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchTimeline}
          className="mt-2 text-blue-600 hover:text-blue-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Application Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{jobTitle}</h3>
            <div className="flex items-center mt-1 text-gray-600">
              <Building2 className="h-4 w-4 mr-1" />
              <span>{company}</span>
            </div>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span>Applied {formatDate(appliedAt)}</span>
            </div>
          </div>
          
          <div className="flex items-center">
            {(() => {
              const statusConfig = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG];
              const Icon = statusConfig?.icon || Clock;
              return (
                <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig?.bgColor} ${statusConfig?.color}`}>
                  <Icon className="h-4 w-4 mr-2" />
                  {statusConfig?.label || currentStatus}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Application Timeline</h4>
        
        {timeline.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No timeline events yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Updates will appear here as your application progresses
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {timeline.map((event, index) => {
              const Icon = getEventIcon(event);
              const iconColor = getEventColor(event);
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex space-x-4"
                >
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 ${iconColor.replace('text-', 'border-')}`}>
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-6 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">
                          {event.title}
                        </h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {event.description}
                        </p>
                        
                        {/* Additional Event Details */}
                        {event.metadata?.message && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{event.metadata.message}</p>
                          </div>
                        )}
                        
                        {event.metadata?.interviewDate && (
                          <div className="mt-2 flex items-center text-sm text-purple-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>
                              {new Date(event.metadata.interviewDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-500">
                          {formatDate(event.timestamp)}
                        </p>
                        {event.actor && (
                          <p className="text-xs text-gray-400 mt-1">
                            by {event.actor.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact Employer
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="h-4 w-4 mr-2" />
            Add Note
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Job Posting
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <XCircle className="h-4 w-4 mr-2" />
            Withdraw Application
          </button>
        </div>
      </div>
    </div>
  );
}
