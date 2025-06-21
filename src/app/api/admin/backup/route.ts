import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/database/prisma';
import { createServerSupabaseClient } from '@/components/ui/card';
import { createDatabaseBackup } from '@/lib/backup/database-backup';

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!session?.user || (session.user as any).role !== 'admin') {
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type = 'manual' } = await req.json();
    
    const result = await createDatabaseBackup(type, (session.user as any).id);
    
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRecord = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!session?.user || (session.user as any).role !== 'admin') {
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

// Note: createDatabaseBackup function is imported from @/lib/backup/database-backup
