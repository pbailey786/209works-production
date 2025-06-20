import { useState } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Download } from 'lucide-react';

'use client';

  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AnalyticsExportButtonProps {
  type?: string;
  className?: string;
}

export default function AnalyticsExportButton({ 
  type = 'overview', 
  className = '' 
}: AnalyticsExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (exportType: string, format: string) => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        type: exportType,
        format,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });

      const response = await fetch(`/api/admin/analytics/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `analytics-${exportType}-${timestamp}.${format}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting} className={className}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport(type, 'csv')}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(type, 'json')}>
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('users', 'csv')}>
          Export Users (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('jobs', 'csv')}>
          Export Jobs (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('ai', 'csv')}>
          Export AI Analytics (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('applications', 'csv')}>
          Export Applications (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
