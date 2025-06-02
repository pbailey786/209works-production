'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  FileText, 
  Shield, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'user_signup' | 'job_posted' | 'job_application' | 'moderation' | 'system_alert';
  title: string;
  description: string;
  timestamp: Date;
  status?: 'success' | 'warning' | 'error';
  actor?: string;
}

// Mock data - in production this would come from an API
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'user_signup',
    title: 'New User Registration',
    description: 'John Smith registered as a jobseeker',
    timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
    status: 'success',
    actor: 'john.smith@email.com'
  },
  {
    id: '2',
    type: 'job_posted',
    title: 'Job Posted',
    description: 'TechCorp posted Senior Software Engineer position',
    timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
    status: 'success',
    actor: 'TechCorp'
  },
  {
    id: '3',
    type: 'moderation',
    title: 'Content Moderated',
    description: 'Job listing flagged for inappropriate content',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    status: 'warning',
    actor: 'Auto-Moderation System'
  },
  {
    id: '4',
    type: 'job_application',
    title: 'Job Application',
    description: 'Sarah Johnson applied to Marketing Manager position',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    status: 'success',
    actor: 'sarah.johnson@email.com'
  },
  {
    id: '5',
    type: 'system_alert',
    title: 'System Alert',
    description: 'High API usage detected - possible rate limiting',
    timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    status: 'warning',
    actor: 'System Monitor'
  }
];

export default function AdminRecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setActivities(mockActivities);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'user_signup':
        return User;
      case 'job_posted':
        return FileText;
      case 'job_application':
        return FileText;
      case 'moderation':
        return Shield;
      case 'system_alert':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getStatusIcon = (status?: Activity['status']) => {
    switch (status) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertCircle;
      case 'error':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status?: Activity['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
          <Eye className="w-4 h-4 mr-1" />
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const ActivityIcon = getActivityIcon(activity.type);
          const StatusIcon = getStatusIcon(activity.status);
          
          return (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <ActivityIcon className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`w-4 h-4 ${getStatusColor(activity.status)}`} />
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
                
                {activity.actor && (
                  <p className="text-xs text-gray-500 mt-1">
                    by {activity.actor}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {activities.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>No recent activity</p>
        </div>
      )}
    </div>
  );
} 