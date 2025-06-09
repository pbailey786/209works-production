import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { Session } from 'next-auth';

// GET - Download backup file
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

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

    if (backup.status !== 'completed') {
      return NextResponse.json({ error: 'Backup is not completed' }, { status: 400 });
    }

    // Download from Supabase storage
    const supabase = createServerSupabaseClient();
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('backups')
      .download(backup.filename);

    if (downloadError || !fileData) {
      console.error('Error downloading backup:', downloadError);
      return NextResponse.json(
        { error: 'Failed to download backup file' },
        { status: 500 }
      );
    }

    // Log the download
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'BACKUP_DOWNLOAD',
        resource: 'database_backup',
        resourceId: backupId,
        details: {
          filename: backup.filename,
          size: backup.size
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    });

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return file as download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${backup.filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading backup:', error);
    return NextResponse.json(
      { error: 'Failed to download backup' },
      { status: 500 }
    );
  }
}
