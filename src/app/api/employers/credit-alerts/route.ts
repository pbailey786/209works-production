import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CreditNotificationService } from '@/lib/services/credit-notifications';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get credit alerts for the user
    const alerts = await CreditNotificationService.checkCreditStatus(userId);
    
    // Get credit usage statistics
    const usageStats = await CreditNotificationService.getCreditUsageStats(userId);

    return NextResponse.json({
      alerts,
      usageStats,
      hasAlerts: alerts.length > 0,
      criticalAlerts: alerts.filter(alert => alert.severity === 'critical').length,
      warningAlerts: alerts.filter(alert => alert.severity === 'warning').length
    });

  } catch (error) {
    console.error('Error fetching credit alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'cleanup_expired') {
      // Clean up expired credits
      const cleanedUp = await CreditNotificationService.cleanupExpiredCredits(userId);
      
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${cleanedUp} expired credits`,
        cleanedUp
      });
    }

    if (action === 'dismiss_alert') {
      const { alertType } = body;
      
      if (!alertType) {
        return NextResponse.json(
          { error: 'Alert type is required' },
          { status: 400 }
        );
      }

      // Record that the alert was dismissed
      await CreditNotificationService.recordNotification(
        userId,
        `${alertType}_dismissed`,
        `User dismissed ${alertType} alert`
      );

      return NextResponse.json({
        success: true,
        message: 'Alert dismissed'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error handling credit alert action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
