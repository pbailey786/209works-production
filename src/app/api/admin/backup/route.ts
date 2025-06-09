import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/database/prisma';
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

// GET - List all backups
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get backup records from database
    const backups = await prisma.systemBackup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // Last 50 backups
    });

    return NextResponse.json({
      success: true,
      backups: backups.map(backup => ({
        id: backup.id,
        filename: backup.filename,
        size: backup.size,
        status: backup.status,
        type: backup.type,
        createdAt: backup.createdAt,
        metadata: backup.metadata,
      }))
    });

  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backups' },
      { status: 500 }
    );
  }
}

// POST - Create new backup
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type = 'manual' } = await req.json();
    
    const result = await createDatabaseBackup(type, session.user.id);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

// DELETE - Delete backup
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const backupId = searchParams.get('id');

    if (!backupId) {
      return NextResponse.json({ error: 'Backup ID required' }, { status: 400 });
    }

    // Get backup record
    const backup = await prisma.systemBackup.findUnique({
      where: { id: backupId }
    });

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    // Delete from Supabase storage
    const supabase = createServerSupabaseClient();
    const { error: storageError } = await supabase.storage
      .from('backups')
      .remove([backup.filename]);

    if (storageError) {
      console.error('Error deleting backup file:', storageError);
    }

    // Delete from database
    await prisma.systemBackup.delete({
      where: { id: backupId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    );
  }
}

// Core backup function
async function createDatabaseBackup(type: 'manual' | 'automated', userId?: string): Promise<BackupResult> {
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

// Export the backup function for use in cron jobs
export { createDatabaseBackup };
