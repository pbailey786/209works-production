import { randomBytes } from 'crypto';
import { prisma } from '@/lib/database/prisma';
import { sendEmail } from '@/lib/email';
import { EmailVerificationTemplate } from '@/lib/email/templates/email-verification';

export interface SendVerificationEmailOptions {
  userId: string;
  email: string;
  userName?: string;
}

/**
 * Send verification email to a user
 */
export async function sendVerificationEmail({
  userId,
  email,
  userName,
}: SendVerificationEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        userId,
        type: 'email_verification',
      },
    });

    // Generate new verification token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new verification token
    await prisma.verificationToken.create({
      data: {
        token,
        userId,
        type: 'email_verification',
        expiresAt,
      },
    });

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    const emailResult = await sendEmail({
      to: email,
      subject: 'Welcome to 209 Works - Verify your email address',
      react: EmailVerificationTemplate({
        userName: userName || email.split('@')[0],
        verificationUrl,
        expiresIn: '24 hours',
      }),
      metadata: {
        source: 'email-verification',
        userId,
      },
      priority: 'critical',
    });

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return { success: false, error: 'Failed to send verification email' };
    }

    console.log('📧 Verification email sent successfully to:', email);
    return { success: true };

  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Check if a user's email is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isEmailVerified: true },
    });

    return user?.isEmailVerified || false;
  } catch (error) {
    console.error('Error checking email verification status:', error);
    return false;
  }
}

/**
 * Clean up expired verification tokens
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    const result = await prisma.verificationToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`🧹 Cleaned up ${result.count} expired verification tokens`);
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}

/**
 * Send reminder email for unverified accounts (12 hours before expiration)
 */
export async function sendVerificationReminders(): Promise<void> {
  try {
    const reminderTime = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
    
    const tokensNearExpiry = await prisma.verificationToken.findMany({
      where: {
        type: 'email_verification',
        expiresAt: {
          gte: new Date(),
          lte: reminderTime,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            isEmailVerified: true,
          },
        },
      },
    });

    for (const tokenData of tokensNearExpiry) {
      // Skip if user is already verified
      if (tokenData.user.isEmailVerified) {
        continue;
      }

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${tokenData.token}`;

      try {
        await sendEmail({
          to: tokenData.user.email,
          subject: 'Reminder: Verify your 209 Works email address',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #2d4a3e 0%, #1d3a2e 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Don't Miss Out!</h1>
                <p style="color: #9fdf9f; margin: 10px 0 0 0; font-size: 16px;">Your verification link expires soon</p>
              </div>
              <div style="padding: 40px 20px; background: white;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Hi ${tokenData.user.name || tokenData.user.email.split('@')[0]},
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Your email verification link will expire in about 12 hours. Don't miss out on accessing all the great features of 209 Works!
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" style="background: #2d4a3e; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Verify Email Now
                  </a>
                </div>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                  If you don't verify your email, you won't be able to apply for jobs or receive important notifications.
                </p>
              </div>
            </div>
          `,
          metadata: {
            source: 'verification-reminder',
            userId: tokenData.userId,
          },
          priority: 'normal',
        });

        console.log('📧 Verification reminder sent to:', tokenData.user.email);
      } catch (emailError) {
        console.error('Failed to send verification reminder:', emailError);
      }
    }

    console.log(`📧 Sent verification reminders to ${tokensNearExpiry.length} users`);
  } catch (error) {
    console.error('Error sending verification reminders:', error);
  }
}
