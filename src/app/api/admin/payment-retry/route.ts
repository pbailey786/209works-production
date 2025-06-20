import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { PaymentRetryService } from '@/components/ui/card';
import { prisma } from '@/components/ui/card';
import { z } from 'zod';

const manualRetrySchema = z.object({
  paymentFailureId: z.string().uuid(),
});

// POST /api/admin/payment-retry - Manual payment retry for admin/customer service
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email },
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentFailureId } = manualRetrySchema.parse(body);

    // Attempt manual retry
    const result = await PaymentRetryService.manualRetry(paymentFailureId);

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: user?.id!,
        action: 'manual_payment_retry',
        details: JSON.stringify({
          paymentFailureId,
          result,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      result,
      message: result.success 
        ? 'Payment retry successful' 
        : result.maxAttemptsReached 
          ? 'Payment retry failed - maximum attempts reached'
          : 'Payment retry failed - will retry automatically later',
    });

  } catch (error) {
    console.error('Manual payment retry error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Manual payment retry failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/payment-retry - Get payment failure statistics and pending retries
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRecord = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userRecord = await prisma.user.findUnique({
      where: { email: user?.email },
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // 'pending', 'resolved', 'all'

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status === 'pending') {
      where.resolved = false;
    } else if (status === 'resolved') {
      where.resolved = true;
    }

    // Get payment failures with pagination
    const [paymentFailures, total] = await Promise.all([
      prisma.paymentFailure.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          subscription: {
            select: {
              id: true,
              tier: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.paymentFailure.count({ where }),
    ]);

    // Get statistics
    const stats = await PaymentRetryService.getRetryStatistics();

    return NextResponse.json({
      success: true,
      data: {
        paymentFailures,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        statistics: stats,
      },
    });

  } catch (error) {
    console.error('Failed to get payment failures:', error);
    
    return NextResponse.json(
      { error: 'Failed to get payment failures' },
      { status: 500 }
    );
  }
}