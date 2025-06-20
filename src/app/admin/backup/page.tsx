import { useState, useEffect } from 'react';

'use client';

import {
  import {
  Database,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  HardDrive,
  Settings
} from 'lucide-react';

interface Backup {
  id: string;
  filename: string;
  size: number;
  status: 'pending' | 'completed' | 'failed';
  type: 'manual' | 'automated';
  createdAt: string;
  metadata?: {
    tableCounts?: Record<string, number>;
    totalRecords?: number;
    error?: string;
  };
}

export default function BackupManagementPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/backup');
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.backups);
      } else {
        setError('Failed to fetch backups');
      }
    } catch (err) {
      setError('Error fetching backups');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setCreating(true);
      setError(null);
      
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'manual' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchBackups(); // Refresh the list
      } else {
        setError(data.error || 'Failed to create backup');
      }
    } catch (err) {
      setError('Error creating backup');
      console.error('Error:', err);
    } finally {
      setCreating(false);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/backup?id=${backupId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchBackups(); // Refresh the list
      } else {
        setError('Failed to delete backup');
      }
    } catch (err) {
      setError('Error deleting backup');
      console.error('Error:', err);
    }
  };

  const downloadBackup = async (backupId: string, filename: string) => {
    try {
      const response = await fetch(`/api/admin/backup/download?id=${backupId}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccess('Backup downloaded successfully');
      } else {
        setError('Failed to download backup');
      }
    } catch (err) {
      setError('Error downloading backup');
      console.error('Error:', err);
    }
  };

  const restoreBackup = async (backupId: string, filename: string) => {
    const confirmed = confirm(
      `⚠️ WARNING: This will completely replace all current data with the backup from ${filename}.\n\n` +
      `This action cannot be undone. Are you absolutely sure you want to proceed?`
    );

    if (!confirmed) return;

    const doubleConfirm = confirm(
      `🚨 FINAL CONFIRMATION: You are about to restore from backup "${filename}".\n\n` +
      `ALL CURRENT DATA WILL BE LOST. Type "RESTORE" in the next prompt to confirm.`
    );

    if (!doubleConfirm) return;

    const confirmText = prompt('Type "RESTORE" to confirm this dangerous operation:');
    if (confirmText !== 'RESTORE') {
      alert('Restoration cancelled - confirmation text did not match.');
      return;
    }

    try {
      setRestoring(backupId);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupId,
          confirmRestore: true
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Backup restored successfully! ${data.totalRecords} records restored across ${data.restoredTables?.length} tables.`);
        if (data.warnings && data.warnings.length > 0) {
          console.warn('Restoration warnings:', data.warnings);
        }
      } else {
        setError(data.error || 'Failed to restore backup');
      }
    } catch (err) {
      setError('Error restoring backup');
      console.error('Error:', err);
    } finally {
      setRestoring(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Database className="mr-3 h-8 w-8 text-[#2d4a3e]" />
            Database Backup Management
          </h1>
          <p className="mt-2 text-gray-600">
            Create, manage, and restore database backups. Automated backups run daily at 2:00 AM.
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={fetchBackups}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={createBackup}
            disabled={creating}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2d4a3e] hover:bg-[#1f3329] disabled:opacity-50"
          >
            <Database className={`mr-2 h-4 w-4 ${creating ? 'animate-pulse' : ''}`} />
            {creating ? 'Creating...' : 'Create Backup'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">{success}</div>
            </div>
          </div>
        </div>
      )}

      {/* Backup Schedule Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Settings className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-sm font-medium text-blue-800">Automated Backup Schedule</h3>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Automated backups are scheduled to run daily at 2:00 AM Pacific Time. 
          Manual backups can be created at any time using the "Create Backup" button above.
        </p>
      </div>

      {/* Backups Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Backup History
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading backups...</span>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No backups found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first backup to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Records
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(backup.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(backup.status)}`}>
                            {backup.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {backup.filename}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          backup.type === 'automated' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {backup.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <HardDrive className="h-4 w-4 mr-1" />
                          {formatFileSize(backup.size)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {backup.metadata?.totalRecords?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(backup.createdAt).toLocaleDateString()} {new Date(backup.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {backup.status === 'completed' && (
                            <>
                              <button
                                onClick={() => downloadBackup(backup.id, backup.filename)}
                                className="text-[#2d4a3e] hover:text-[#1f3329] flex items-center"
                                title="Download backup"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => restoreBackup(backup.id, backup.filename)}
                                disabled={restoring === backup.id}
                                className="text-blue-600 hover:text-blue-900 flex items-center disabled:opacity-50"
                                title="Restore from backup"
                              >
                                <RefreshCw className={`h-4 w-4 ${restoring === backup.id ? 'animate-spin' : ''}`} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteBackup(backup.id)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                            title="Delete backup"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
