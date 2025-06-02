import { NextRequest, NextResponse } from 'next/server';
import { emailQueue } from '@/lib/services/email-queue';
import { z } from 'zod';

// Validation schemas
const addJobSchema = z.object({
  type: z.enum(['job_alert', 'weekly_digest', 'password_reset', 'verification', 'generic']),
  to: z.string().email(),
  subject: z.string(),
  template: z.string(),
  data: z.record(z.any()),
  userId: z.string().optional(),
  alertId: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  delay: z.number().min(0).optional(),
  retryLimit: z.number().min(1).max(10).optional(),
  metadata: z.record(z.any()).optional(),
});

const bulkJobSchema = z.object({
  jobs: z.array(z.object({
    data: addJobSchema,
    options: z.object({
      priority: z.number().optional(),
      delay: z.number().optional(),
      attempts: z.number().optional(),
    }).optional(),
  })),
});

const queueActionSchema = z.object({
  action: z.enum(['pause', 'resume', 'clear']),
});

// Verify admin access (you can implement your own authorization logic)
function verifyAdminAccess(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  
  if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    return false;
  }
  
  return authHeader?.startsWith('Bearer ') || false;
}

// GET /api/email-queue - Get queue statistics and status
export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminAccess(req)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const stats = await emailQueue.getQueueStats();
    
    return NextResponse.json({
      message: 'Email queue status',
      data: {
        stats,
        timestamp: new Date().toISOString(),
        queueName: 'email-queue',
        isHealthy: stats.active >= 0, // Basic health check
      },
    });

  } catch (error) {
    console.error('Email queue status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get queue status', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// POST /api/email-queue - Add email job(s) or perform queue actions
export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminAccess(req)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // Handle queue management actions
    if (action) {
      const { action: validatedAction } = queueActionSchema.parse({ action });
      
      switch (validatedAction) {
        case 'pause':
          await emailQueue.pauseQueue();
          return NextResponse.json({ message: 'Queue paused successfully' });
        
        case 'resume':
          await emailQueue.resumeQueue();
          return NextResponse.json({ message: 'Queue resumed successfully' });
        
        case 'clear':
          await emailQueue.clearQueue();
          return NextResponse.json({ message: 'Queue cleared successfully' });
        
        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          );
      }
    }

    // Handle bulk job addition
    if (body.jobs && Array.isArray(body.jobs)) {
      const validatedData = bulkJobSchema.parse(body);
      
      const jobs = await emailQueue.addBulkEmailJobs(validatedData.jobs);
      
      return NextResponse.json({
        message: `Successfully added ${jobs.length} email jobs to queue`,
        data: {
          jobIds: jobs.map(job => job.id),
          count: jobs.length,
        },
      });
    }

    // Handle single job addition
    const validatedData = addJobSchema.parse(body);
    
    const job = await emailQueue.addEmailJob(validatedData);
    
    return NextResponse.json({
      message: 'Email job added to queue successfully',
      data: {
        jobId: job.id,
        to: validatedData.to,
        type: validatedData.type,
        priority: validatedData.priority,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Email queue operation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process queue operation', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/email-queue - Close queue system (mainly for cleanup)
export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminAccess(req)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    await emailQueue.close();
    
    return NextResponse.json({
      message: 'Email queue system closed successfully',
    });

  } catch (error) {
    console.error('Email queue close error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to close queue system', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 