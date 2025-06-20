import { prisma } from '@/components/ui/card';
import { createServerSupabaseClient } from '@/lib/supabase';

interface BackupResult {
  success: boolean;
  backupId?: string;
  filename?: string;
  size?: number;
  tables?: Record<string, number>;
  error?: string;
  timestamp?: string;
}

// Core backup function that can be used by both API routes and cron jobs
export async function createDatabaseBackup(type: 'manual' | 'automated', userId?: string): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.json`;
  
  try {
    console.log(`🔄 Starting ${type} database backup...`);
    
    // Get all table data
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        type,
        version: '1.0',
        database: 'postgresql',
      },
      tables: {} as Record<string, any[]>
    };

    // Define tables to backup
    const tablesToBackup = [
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

    const tableCounts: Record<string, number> = {};

    // Backup each table
    for (const tableName of tablesToBackup) {
      try {
        const modelName = tableName.toLowerCase() as keyof typeof prisma;
        if (prisma[modelName] && typeof (prisma[modelName] as any).findMany === 'function') {
          const data = await (prisma[modelName] as any).findMany();
          backupData.tables[tableName] = data;
          tableCounts[tableName] = data.length;
          console.log(`✅ Backed up ${tableName}: ${data.length} records`);
        }
      } catch (error) {
        console.error(`❌ Error backing up ${tableName}:`, error);
        tableCounts[tableName] = 0;
      }
    }

    // Convert to JSON
    const backupJson = JSON.stringify(backupData, null, 2);
    const backupBuffer = Buffer.from(backupJson, 'utf-8');
    const size = backupBuffer.length;

    // Upload to Supabase storage
    const supabase = createServerSupabaseClient();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('backups')
      .upload(filename, backupBuffer, {
        contentType: 'application/json',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Save backup record to database
    const backupRecord = await prisma.systemBackup.create({
      data: {
        filename,
        size,
        status: 'completed',
        type,
        metadata: {
          tableCounts,
          totalRecords: Object.values(tableCounts).reduce((a, b) => a + b, 0),
          uploadPath: uploadData.path,
        },
        createdBy: userId || 'system',
      }
    });

    console.log(`✅ Backup completed: ${filename} (${(size / 1024 / 1024).toFixed(2)} MB)`);

    return {
      success: true,
      backupId: backupRecord.id,
      filename,
      size,
      tables: tableCounts,
      timestamp: backupRecord.createdAt.toISOString(),
    };

  } catch (error) {
    console.error('❌ Backup failed:', error);
    
    // Record failed backup
    try {
      await prisma.systemBackup.create({
        data: {
          filename,
          size: 0,
          status: 'failed',
          type,
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
          createdBy: userId || 'system',
        }
      });
    } catch (dbError) {
      console.error('Failed to record backup failure:', dbError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
