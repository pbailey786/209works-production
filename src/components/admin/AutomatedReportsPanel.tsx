import { useState, useEffect } from '@/components/ui/card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Input } from '@/components/ui/card';
import { Label } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


'use client';
import {
  import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/card';
import {
  import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/card';
import {
  import {
  Mail,
  Calendar,
  FileText,
  Send,
  Trash2,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ReportSchedule {
  id: string;
  type: string;
  frequency: string;
  recipients: string[];
  lastSent?: string;
  nextScheduled?: string;
  status: 'active' | 'paused' | 'error';
}

export default function AutomatedReportsPanel() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    type: 'weekly',
    recipients: '',
    frequency: 'weekly',
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/admin/reports/schedules');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: newSchedule.type,
          recipients: newSchedule.recipients.split(',').map(email => email.trim()),
          includeCharts: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Report generated and sent successfully!');
        fetchSchedules(); // Refresh the list
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Report generation failed:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const createSchedule = async () => {
    try {
      const response = await fetch('/api/admin/reports/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newSchedule,
          recipients: newSchedule.recipients.split(',').map(email => email.trim()),
        }),
      });

      if (response.ok) {
        setNewSchedule({ type: 'weekly', recipients: '', frequency: 'weekly' });
        fetchSchedules();
        alert('Report schedule created successfully!');
      } else {
        throw new Error('Failed to create schedule');
      }
    } catch (error) {
      console.error('Failed to create schedule:', error);
      alert('Failed to create schedule. Please try again.');
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch(`/api/admin/reports/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSchedules();
        alert('Schedule deleted successfully!');
      } else {
        throw new Error('Failed to delete schedule');
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('Failed to delete schedule. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate One-Time Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select
                value={newSchedule.type}
                onValueChange={(value) => setNewSchedule({ ...newSchedule, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Report</SelectItem>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recipients">Recipients (comma-separated)</Label>
              <Input
                id="recipients"
                placeholder="admin@209.works, manager@209.works"
                value={newSchedule.recipients}
                onChange={(e) => setNewSchedule({ ...newSchedule, recipients: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={generateReport} 
                disabled={isGenerating || !newSchedule.recipients}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate & Send'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No scheduled reports yet. Create one above to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Last Sent</TableHead>
                  <TableHead>Next Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)}
                    </TableCell>
                    <TableCell>{schedule.frequency}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {schedule.recipients.slice(0, 2).map((email, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {email}
                          </Badge>
                        ))}
                        {schedule.recipients.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{schedule.recipients.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {schedule.lastSent 
                        ? new Date(schedule.lastSent).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      {schedule.nextScheduled 
                        ? new Date(schedule.nextScheduled).toLocaleDateString()
                        : 'Not scheduled'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(schedule.status)}
                        <span className="capitalize">{schedule.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSchedule(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
