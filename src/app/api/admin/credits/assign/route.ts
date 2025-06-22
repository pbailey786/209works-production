import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { EmailQueue } from '@/lib/services/email-queue';
import { z } from 'zod';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

const assignCreditsSchema = z.object({
  userEmail: z.string().email('Invalid email address'),
  creditAmount: z.number().min(1, 'Credit amount must be at least 1').max(100, 'Credit amount cannot exceed 100'),
  creditType: z.enum(['job_post', 'featured_post', 'social_graphic'], {
    errorMap: () => ({ message: 'Invalid credit type' })
  }),
  note: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get admin user and verify permissions
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true },
    });

    // TODO: Replace with Clerk permissions
    // if (!adminUser || !hasPermission(userRole, Permission.ADMIN_ACCESS)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }

    const body = await request.json();
    const validatedData = assignCreditsSchema.parse(body);

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { email: validatedData.userEmail },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create a manual purchase record for tracking
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 60); // 60 days from now

    const purchase = await prisma.jobPostingPurchase.create({
      data: {
        userId: targetUser.id,
        stripeSessionId: `manual_${Date.now()}_${adminUser.id}`,
        tier: 'manual_assignment',
        tierPrice: 0,
        addons: [],
        totalAmount: 0,
        status: 'completed',
        jobPostCredits: validatedData.creditType === 'job_post' ? validatedData.creditAmount : 0,
        featuredPostCredits: validatedData.creditType === 'featured_post' ? validatedData.creditAmount : 0,
        socialGraphicCredits: validatedData.creditType === 'social_graphic' ? validatedData.creditAmount : 0,
        repostCredits: 0,
        expiresAt: expirationDate,
        metadata: {
          manualAssignment: true,
          assignedBy: adminUser.id,
          assignedByName: adminUser.name,
          note: validatedData.note,
          assignedAt: new Date().toISOString(),
        },
      },
    });

    // Create individual credit records
    const creditsToCreate = [];
    for (let i = 0; i < validatedData.creditAmount; i++) {
      creditsToCreate.push({
        userId: targetUser.id,
        purchaseId: purchase.id,
        type: validatedData.creditType,
        expiresAt: expirationDate,
      });
    }

    await prisma.jobPostingCredit.createMany({
      data: creditsToCreate,
    });

    // Send confirmation email
    try {
      const emailQueue = EmailQueue.getInstance();
      await emailQueue.addCreditConfirmationEmail(
        targetUser.email,
        {
          userName: targetUser.name || 'Valued Customer',
          creditAmount: validatedData.creditAmount,
          planType: 'MANUAL ASSIGNMENT',
          dashboardUrl: `${process.env.NEXTAUTH_URL}/employers/dashboard`,
          expirationDate: expirationDate.toLocaleDateString(),
        },
        targetUser.id
      );
    } catch (emailError) {
      console.error('Failed to send credit confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Log the admin action
    console.log(`Admin ${adminUser.name} (${adminUser.id}) assigned ${validatedData.creditAmount} ${validatedData.creditType} credits to ${targetUser.email}`);

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${validatedData.creditAmount} ${validatedData.creditType.replace('_', ' ')} credits to ${targetUser.email}`,
      data: {
        purchaseId: purchase.id,
        creditsAssigned: validatedData.creditAmount,
        creditType: validatedData.creditType,
        expiresAt: expirationDate,
      },
    });

  } catch (error) {
    console.error('Error assigning credits:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch credit statistics for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get admin user and verify permissions
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    // TODO: Replace with Clerk permissions
    // if (!adminUser || !hasPermission(userRole, Permission.ADMIN_ACCESS)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    // }

    // Get credit statistics
    const [
      totalCreditsIssued,
      totalCreditsUsed,
      totalCreditsExpired,
      recentManualAssignments,
    ] = await Promise.all([
      prisma.jobPostingCredit.count(),
      prisma.jobPostingCredit.count({ where: { isUsed: true } }),
      prisma.jobPostingCredit.count({
        where: {
          expiresAt: { lt: new Date() },
          isUsed: false
        }
      }),
      prisma.jobPostingPurchase.findMany({
        where: {
          tier: 'manual_assignment'
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      }),
    ]);

    return NextResponse.json({
      totalCreditsIssued,
      totalCreditsUsed,
      totalCreditsExpired,
      activeCredits: totalCreditsIssued - totalCreditsUsed - totalCreditsExpired,
      recentManualAssignments,
    });

  } catch (error) {
    console.error('Error fetching credit statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
