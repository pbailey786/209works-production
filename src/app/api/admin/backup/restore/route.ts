import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import { createServerSupabaseClient } from '@/lib/supabase';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

interface RestoreResult {
  success: boolean;
  restoredTables?: string[];
  totalRecords?: number;
  error?: string;
  warnings?: string[];
}

// POST - Restore from backup
export async function POST(req: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;

    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { backupId, confirmRestore } = await req.json();

    if (!backupId) {
      return NextResponse.json({ error: 'Backup ID required' }, { status: 400 });
    }

    if (!confirmRestore) {
      return NextResponse.json({ 
        error: 'Restore confirmation required. This will overwrite existing data.' 
      }, { status: 400 });
    }

    const result = await restoreFromBackup(backupId, (session.user as any).id);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { error: 'Failed to restore backup' },
      { status: 500 }
    );
  }
}

// Core restore function
async function restoreFromBackup(backupId: string, userId: string): Promise<RestoreResult> {
  try {
    console.log(`🔄 Starting backup restoration for backup: ${backupId}`);
    
    // Get backup record
    const backup = await prisma.systemBackup.findUnique({
      where: { id: backupId }
    });

    if (!backup) {
      return { success: false, error: 'Backup not found' };
    }

    if (backup.status !== 'completed') {
      return { success: false, error: 'Cannot restore from incomplete backup' };
    }

    // Download backup file from Supabase
    const supabase = createServerSupabaseClient();
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('backups')
      .download(backup.filename);

    if (downloadError || !fileData) {
      return { success: false, error: `Failed to download backup file: ${downloadError?.message}` };
    }

    // Parse backup data
    const backupText = await fileData.text();
    const backupData = JSON.parse(backupText);

    if (!backupData.tables) {
      return { success: false, error: 'Invalid backup format: no tables data found' };
    }

    const restoredTables: string[] = [];
    const warnings: string[] = [];
    let totalRecords = 0;

    // Create a transaction for the restore operation
    await prisma.$transaction(async (tx) => {
      // Define the order of table restoration (to handle foreign key dependencies)
      const tableOrder = [
        'User',
        'Company',
        'Job',
        'JobApplication',
        'SavedJob',
        'ChatHistory',
        'ChatAnalytics',
        'AuditLog',
        'EmailLog'
      ];

      // First, clear existing data (in reverse order to handle dependencies)
      console.log('🗑️ Clearing existing data...');
      for (const tableName of tableOrder.reverse()) {
        try {
          if (backupData.tables[tableName]) {
            const modelName = tableName.toLowerCase() as keyof typeof tx;
            if (tx[modelName] && typeof (tx[modelName] as any).deleteMany === 'function') {
              const deleteResult = await (tx[modelName] as any).deleteMany({});
              console.log(`✅ Cleared ${tableName}: ${deleteResult.count} records`);
            }
          }
        } catch (error) {
          console.error(`❌ Error clearing ${tableName}:`, error);
          warnings.push(`Failed to clear ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Restore data (in correct order)
      tableOrder.reverse(); // Back to original order
      for (const tableName of tableOrder) {
        try {
          const tableData = backupData.tables[tableName];
          if (tableData && Array.isArray(tableData) && tableData.length > 0) {
            const modelName = tableName.toLowerCase() as keyof typeof tx;
            
            if (tx[modelName] && typeof (tx[modelName] as any).createMany === 'function') {
              // Process data in batches to avoid memory issues
              const batchSize = 100;
              let recordsRestored = 0;
              
              for (let i = 0; i < tableData.length; i += batchSize) {
                const batch = tableData.slice(i, i + batchSize);
                
                // Clean the data (remove any fields that might cause issues)
                const cleanedBatch = batch.map(record => {
                  const cleaned = { ...record };
                  
                  // Convert date strings back to Date objects
                  Object.keys(cleaned).forEach(key => {
                    if (typeof cleaned[key] === 'string' && 
                        (key.includes('At') || key.includes('Date') || key.includes('Time'))) {
                      try {
                        const date = new Date(cleaned[key]);
                        if (!isNaN(date.getTime())) {
                          cleaned[key] = date;
                        }
                      } catch (e) {
                        // Keep original value if date parsing fails
                      }
                    }
                  });
                  
                  return cleaned;
                });

                const result = await (tx[modelName] as any).createMany({
                  data: cleanedBatch,
                  skipDuplicates: true
                });
                
                recordsRestored += result.count;
              }
              
              console.log(`✅ Restored ${tableName}: ${recordsRestored} records`);
              restoredTables.push(tableName);
              totalRecords += recordsRestored;
            }
          }
        } catch (error) {
          console.error(`❌ Error restoring ${tableName}:`, error);
          warnings.push(`Failed to restore ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    });

    // Log the restoration
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BACKUP_RESTORE',
        resource: 'database',
        resourceId: backupId,
        details: {
          backupFilename: backup.filename,
          restoredTables,
          totalRecords,
          warnings: warnings.length > 0 ? warnings : undefined
        },
        ipAddress: 'system',
        userAgent: 'backup-restore-system'
      }
    });

    console.log(`✅ Backup restoration completed: ${totalRecords} total records restored`);

    return {
      success: true,
      restoredTables,
      totalRecords,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    console.error('❌ Backup restoration failed:', error);
    
    // Log the failed restoration
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'BACKUP_RESTORE_FAILED',
          resource: 'database',
          resourceId: backupId,
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          ipAddress: 'system',
          userAgent: 'backup-restore-system'
        }
      });
    } catch (logError) {
      console.error('Failed to log restoration failure:', logError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during restoration'
    };
  }
}

// Note: restoreFromBackup function is available within this module
// but not exported to avoid Next.js API route conflicts
