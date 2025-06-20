'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  createdAt: string;
  actionUrl?: string;
}

interface UseRealTimeNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
}

export function useRealTimeNotifications(): UseRealTimeNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=20');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Set up polling for real-time updates (simplified approach)
  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/notifications?limit=5&unreadOnly=true');
        if (response.ok) {
          const data = await response.json();
          
          // Check for new notifications
          const newNotifications = data.notifications.filter((notification: Notification) =>
            !notifications.find(existing => existing.id === notification.id)
          );

          if (newNotifications.length > 0) {
            setNotifications(prev => [...newNotifications, ...prev]);
            setUnreadCount(data.unreadCount);

            // Show toast for high priority notifications
            newNotifications.forEach((notification: Notification) => {
              if (notification.priority === 'high' || notification.priority === 'urgent') {
                toast({
                  title: notification.title,
                  description: notification.message,
                  duration: notification.priority === 'urgent' ? 10000 : 5000,
                });
              }
            });
          }
        }
        setIsConnected(true);
      } catch (error) {
        console.error('Error polling notifications:', error);
        setIsConnected(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, notifications, toast]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
}
