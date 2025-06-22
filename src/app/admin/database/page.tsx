'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface DatabaseStatus {
  timestamp: string;
  database: string;
  tables: Record<string, { exists: boolean; count: number | string; error?: string }>;
  errors: string[];
}

interface MigrationResult {
  success: boolean;
  results: {
    timestamp: string;
    migrations: string[];
    errors: string[];
    success: boolean;
  };
  summary: {
    migrationsRun: number;
    errorsFound: number;
    overallSuccess: boolean;
  };
}

export default function DatabaseManagementPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const checkDatabaseStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/database-status');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      } else {
        console.error('Failed to check database status:', data.error);
      }
    } catch (error) {
      console.error('Error checking database status:', error);
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    setMigrating(true);
    try {
      const response = await fetch('/api/admin/run-migration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setMigrationResult(data);

      // Refresh status after migration
      if (data.success) {
        setTimeout(() => {
          checkDatabaseStatus();
        }, 1000);
      }
    } catch (error) {
      console.error('Error running migration:', error);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage database tables and migrations
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={checkDatabaseStatus} 
            disabled={loading}
            variant="outline"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Check Status
          </Button>
          <Button
            onClick={runMigration}
            disabled={migrating}
          >
            {migrating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
            Run Migration
          </Button>
        </div>
      </div>

      {/* Database Status */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Status
            </CardTitle>
            <CardDescription>
              Last checked: {new Date(status.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Connection:</span>
                <Badge variant={status.database === 'connected' ? 'default' : 'destructive'}>
                  {status.database}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2">Tables</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(status.tables).map(([tableName, tableInfo]) => (
                    <div key={tableName} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">{tableName}</span>
                      <div className="flex items-center gap-2">
                        {tableInfo.exists ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-muted-foreground">
                              {tableInfo.count} records
                            </span>
                          </>
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {status.errors.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-1">
                      <strong>Errors found:</strong>
                      {status.errors.map((error, index) => (
                        <div key={index} className="text-sm font-mono">
                          {error}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Results */}
      {migrationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {migrationResult.summary.overallSuccess ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Migration Results
            </CardTitle>
            <CardDescription>
              {migrationResult.summary.migrationsRun} migrations run, {migrationResult.summary.errorsFound} errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {migrationResult.results.migrations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-green-700">Successful Migrations</h4>
                  <div className="space-y-1">
                    {migrationResult.results.migrations.map((migration, index) => (
                      <div key={index} className="text-sm font-mono bg-green-50 p-2 rounded">
                        {migration}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {migrationResult.results.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-red-700">Errors</h4>
                  <div className="space-y-1">
                    {migrationResult.results.errors.map((error, index) => (
                      <div key={index} className="text-sm font-mono bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. <strong>Check Status</strong> - Verify which tables exist and their record counts</p>
            <p>2. <strong>Run Migration</strong> - Create missing tables (SavedJob, ChatHistory) if they don't exist</p>
            <p>3. Missing tables will show with a red X icon</p>
            <p>4. Existing tables will show with a green checkmark and record count</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
