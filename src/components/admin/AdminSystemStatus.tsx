'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Wifi,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from 'lucide-react';

interface SystemHealth {
  status: string;
  uptime: string;
  responseTime: string;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'warning' | 'offline';
  responseTime?: string;
  lastCheck: Date;
}

interface AdminSystemStatusProps {
  systemHealth: SystemHealth;
}

export default function AdminSystemStatus({
  systemHealth,
}: AdminSystemStatusProps) {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Mock service statuses - in production this would come from actual monitoring
  const mockServices: ServiceStatus[] = [
    {
      name: 'API Server',
      status: 'online',
      responseTime: '120ms',
      lastCheck: new Date(),
    },
    {
      name: 'Database',
      status: 'online',
      responseTime: '45ms',
      lastCheck: new Date(),
    },
    {
      name: 'Redis Cache',
      status: 'online',
      responseTime: '15ms',
      lastCheck: new Date(),
    },
    {
      name: 'Email Service',
      status: 'warning',
      responseTime: '2.1s',
      lastCheck: new Date(),
    },
    {
      name: 'File Storage',
      status: 'online',
      responseTime: '180ms',
      lastCheck: new Date(),
    },
  ];

  useEffect(() => {
    // Simulate loading services
    const timer = setTimeout(() => {
      setServices(mockServices);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const refreshStatus = () => {
    setLoading(true);
    setLastRefresh(new Date());

    // Simulate refresh
    setTimeout(() => {
      setServices([...mockServices]);
      setLoading(false);
    }, 1000);
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'offline':
        return XCircle;
      default:
        return Activity;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'offline':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getServiceIcon = (serviceName: string) => {
    if (serviceName.includes('API')) return Server;
    if (serviceName.includes('Database') || serviceName.includes('Redis'))
      return Database;
    if (serviceName.includes('Email') || serviceName.includes('Storage'))
      return Wifi;
    return Activity;
  };

  const overallStatus = services.every(s => s.status === 'online')
    ? 'online'
    : services.some(s => s.status === 'offline')
      ? 'offline'
      : 'warning';

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">System Status</h3>
        <button
          onClick={refreshStatus}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Overall Status */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div
            className={`h-3 w-3 rounded-full ${
              overallStatus === 'online'
                ? 'bg-green-500'
                : overallStatus === 'warning'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
          ></div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              System{' '}
              {overallStatus === 'online'
                ? 'Operational'
                : overallStatus === 'warning'
                  ? 'Degraded'
                  : 'Down'}
            </p>
            <p className="text-xs text-gray-500">
              Uptime: {systemHealth.uptime}
            </p>
          </div>
        </div>
      </div>

      {/* Service List */}
      <div className="space-y-3">
        {loading
          ? [...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center space-x-3"
              >
                <div className="h-4 w-4 rounded bg-gray-200"></div>
                <div className="h-4 flex-1 rounded bg-gray-200"></div>
                <div className="h-4 w-12 rounded bg-gray-200"></div>
              </div>
            ))
          : services.map((service, index) => {
              const StatusIcon = getStatusIcon(service.status);
              const ServiceIcon = getServiceIcon(service.name);

              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ServiceIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {service.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {service.responseTime && (
                      <span className="text-xs text-gray-500">
                        {service.responseTime}
                      </span>
                    )}
                    <StatusIcon
                      className={`h-4 w-4 ${getStatusColor(service.status)}`}
                    />
                  </div>
                </div>
              );
            })}
      </div>

      {/* Last Check */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        <p className="text-xs text-gray-500">
          Last check: {lastRefresh.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
