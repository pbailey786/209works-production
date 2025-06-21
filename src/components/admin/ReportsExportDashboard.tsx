import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/card';
import { Label } from '@/components/ui/card';
import { Calendar } from '@/components/ui/card';
import { format } from 'date-fns';

'use client';

  import { Card } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from 'lucide-react';

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  estimatedRows?: number;
  lastGenerated?: Date;
  status?: 'available' | 'generating' | 'error';
}

interface ExportRequest {
  reportType: string;
  format: 'csv' | 'pdf' | 'excel';
  dateFrom: Date | null;
  dateTo: Date | null;
  filters?: any;
}

export default function ReportsExportDashboard() {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>(
    'csv'
  );
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<any[]>([]);

  const reportTypes: ReportConfig[] = [
    {
      id: 'user_activity',
      name: 'User Activity Report',
      description:
        'Comprehensive user engagement, login patterns, and activity metrics',
      icon: Users,
      category: 'Users',
      estimatedRows: 15420,
      lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'available'
    },
    {
      id: 'job_listings',
      name: 'Job Listings Report',
      description:
        'All job postings with status, applications, and performance metrics',
      icon: Briefcase,
      category: 'Jobs',
      estimatedRows: 8934,
      lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 6),
      status: 'available'
    },
    {
      id: 'revenue_analytics',
      name: 'Revenue Analytics',
      description:
        'Financial performance, subscription revenue, and payment analytics',
      icon: DollarSign,
      category: 'Finance',
      estimatedRows: 2156,
      lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 12),
      status: 'available'
    },
    {
      id: 'system_performance',
      name: 'System Performance Report',
      description:
        'Server metrics, response times, error rates, and uptime statistics',
      icon: Activity,
      category: 'System',
      estimatedRows: 50000,
      lastGenerated: new Date(Date.now() - 1000 * 60 * 30),
      status: 'available'
    },
    {
      id: 'application_analytics',
      name: 'Application Analytics',
      description:
        'Job application trends, success rates, and candidate insights',
      icon: TrendingUp,
      category: 'Analytics',
      estimatedRows: 12678,
      lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 4),
      status: 'available'
    },
    {
      id: 'moderation_log',
      name: 'Moderation Activity Log',
      description:
        'Content moderation actions, flagged content, and admin activities',
      icon: AlertCircle,
      category: 'Moderation',
      estimatedRows: 3421,
      lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 8),
      status: 'available'
    },
    {
      id: 'advertisement_performance',
      name: 'Advertisement Performance',
      description:
        'Ad campaign metrics, click-through rates, and revenue attribution',
      icon: BarChart3,
      category: 'Marketing',
      estimatedRows: 1876,
      lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: 'generating'
    },
    {
      id: 'security_audit',
      name: 'Security Audit Report',
      description:
        'Security events, failed login attempts, and access patterns',
      icon: AlertCircle,
      category: 'Security',
      estimatedRows: 8765,
      lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 1),
      status: 'available'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-3 w-3" />;
      case 'generating':
        return <Clock className="h-3 w-3" />;
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const handleExport = async () => {
    if (!selectedReport) {
      alert('Please select a report type');
      return;
    }

    setIsExporting(true);

    try {
      const exportRequest: ExportRequest = {
        reportType: selectedReport,
        format: exportFormat,
        dateFrom,
        dateTo
      };

      const response = await fetch('/api/admin/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportRequest)
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const reportName =
        reportTypes.find(r => r.id === selectedReport)?.name || 'report';
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
      a.download = `${reportName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.${exportFormat}`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Add to export history
      const newExport = {
        id: Date.now().toString(),
        reportType: selectedReport,
        reportName: reportTypes.find(r => r.id === selectedReport)?.name,
        format: exportFormat,
        timestamp: new Date(),
        status: 'completed',
        fileSize: '2.4 MB', // Mock file size
      };

      setExportHistory(prev => [newExport, ...prev.slice(0, 9)]); // Keep last 10 exports
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedReportConfig = reportTypes.find(r => r.id === selectedReport);

  return (
    <div className="space-y-6">
      {/* Report Selection */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reportTypes.map(report => {
          const Icon = report.icon;
          const isSelected = selectedReport === report.id;

          return (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'bg-blue-50 ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <Badge variant="outline" className="text-xs">
                      {report.category}
                    </Badge>
                  </div>
                  <Badge
                    className={`${getStatusColor(report.status || 'available')} flex items-center space-x-1`}
                  >
                    {getStatusIcon(report.status || 'available')}
                    <span className="capitalize">
                      {report.status || 'available'}
                    </span>
                  </Badge>
                </div>
                <CardTitle className="text-sm font-medium">
                  {report.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-gray-600">
                  {report.description}
                </p>
                <div className="space-y-1 text-xs text-gray-500">
                  <div>~{report.estimatedRows?.toLocaleString()} rows</div>
                  {report.lastGenerated && (
                    <div>
                      Last: {format(report.lastGenerated, 'MMM dd, HH:mm')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Export Configuration */}
      {selectedReport && (
        <Card>
          <CardHeader>
            <CardTitle>Export Configuration</CardTitle>
            <CardDescription>
              Configure export settings for {selectedReportConfig?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Export Format */}
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select
                  value={exportFormat}
                  onValueChange={(value: any) => setExportFormat(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label>Date From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'PPP') : 'Select start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom || undefined}
                      onSelect={date => setDateFrom(date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label>Date To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'PPP') : 'Select end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo || undefined}
                      onSelect={date => setDateTo(date || null)}
                      disabled={date => (dateFrom ? date < dateFrom : false)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Export Button */}
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  onClick={handleExport}
                  disabled={
                    isExporting || selectedReportConfig?.status === 'generating'
                  }
                  className="w-full"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Report
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Export Preview Info */}
            {selectedReportConfig && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <h4 className="mb-2 text-sm font-medium">Export Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <span className="text-gray-600">Report:</span>
                    <div className="font-medium">
                      {selectedReportConfig.name}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Format:</span>
                    <div className="font-medium uppercase">{exportFormat}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Estimated Size:</span>
                    <div className="font-medium">
                      {exportFormat === 'pdf'
                        ? '5-15 MB'
                        : exportFormat === 'excel'
                          ? '2-8 MB'
                          : '1-5 MB'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Est. Rows:</span>
                    <div className="font-medium">
                      {selectedReportConfig.estimatedRows?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export History */}
      {exportHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Exports</CardTitle>
            <CardDescription>
              Your recent report exports and downloads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exportHistory.map(exportItem => (
                <div
                  key={exportItem.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium">
                        {exportItem.reportName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(exportItem.timestamp, 'MMM dd, yyyy HH:mm')} •
                        {exportItem.format.toUpperCase()} •{' '}
                        {exportItem.fileSize}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
