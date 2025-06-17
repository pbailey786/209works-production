import crypto from 'crypto';
import { prisma } from '@/lib/database/prisma';
import { EmailHelpers } from '@/lib/email/email-helpers';
import { normalizeEmail } from '@/lib/utils/email-utils';
import { hash } from 'bcryptjs';

// Security constants
const TOKEN_LENGTH = 48; // Increased from 32 bytes
const TOKEN_EXPIRY_HOURS = 1;
const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_ROUNDS = 12;
const MAX_RESET_ATTEMPTS_PER_DAY = 5;

// Password complexity requirements
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export const passwordRequirements: PasswordRequirements = {
  minLength: MIN_PASSWORD_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

export class PasswordResetService {
  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < passwordRequirements.minLength) {
      errors.push(`Password must be at least ${passwordRequirements.minLength} characters long`);
    }

    if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (passwordRequirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a stronger password');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user has exceeded reset attempts
   */
  static async checkResetRateLimit(email: string): Promise<boolean> {
    const normalizedEmail = normalizeEmail(email);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentAttempts = await prisma.securityLog.count({
      where: {
        user: {
          email: normalizedEmail
        },
        event: 'PASSWORD_RESET_REQUESTED',
        createdAt: {
          gte: oneDayAgo
        }
      }
    });

    return recentAttempts < MAX_RESET_ATTEMPTS_PER_DAY;
  }

  /**
   * Generate secure password reset token
   */
  static async generateResetToken(email: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = normalizeEmail(email);

    // Check rate limit
    const withinRateLimit = await this.checkResetRateLimit(normalizedEmail);
    if (!withinRateLimit) {
      return {
        success: false,
        message: 'Too many password reset attempts. Please try again later.'
      };
    }

    // Find user (but don't reveal if they exist)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        isEmailVerified: true
      }
    });

    // Always return success message to prevent user enumeration
    const genericMessage = 'If an account exists with that email, a password reset link has been sent.';

    if (!user || !user.isEmailVerified) {
      // Log attempt for non-existent user (for security monitoring)
      if (!user) {
        console.log(`Password reset attempted for non-existent email: ${normalizedEmail}`);
      }
      return { success: true, message: genericMessage };
    }

    // Generate cryptographically secure token
    const token = crypto.randomBytes(TOKEN_LENGTH).toString('base64url');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Store hashed token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
      }
    });

    // Log security event
    await prisma.securityLog.create({
      data: {
        userId: user.id,
        event: 'PASSWORD_RESET_REQUESTED',
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
        metadata: {
          expiresAt: expiresAt.toISOString()
        }
      }
    });

    // Send email with unhashed token
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    try {
      await EmailHelpers.sendPasswordReset(user.email, {
        userName: user.name || user.email.split('@')[0],
        resetUrl,
        expiresIn: `${TOKEN_EXPIRY_HOURS} hour${TOKEN_EXPIRY_HOURS > 1 ? 's' : ''}`,
      }, {
        userId: user.id,
        priority: 'urgent',
      });

      return { success: true, message: genericMessage };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      
      // Clean up token on email failure
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null,
        }
      });

      return {
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      };
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    token: string, 
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string; errors?: string[] }> {
    // Validate token format
    if (!token || token.length < 32) {
      return {
        success: false,
        message: 'Invalid or missing reset token'
      };
    }

    // Validate password strength
    const passwordValidation = this.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors
      };
    }

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date() // Token not expired
        }
      },
      select: {
        id: true,
        email: true,
        passwordHash: true
      }
    });

    if (!user) {
      // Log failed attempt
      console.log('Password reset attempted with invalid/expired token');
      
      return {
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset.'
      };
    }

    // Check if new password is same as old password
    const isSamePassword = await compare(newPassword, user.passwordHash || '');
    if (isSamePassword) {
      return {
        success: false,
        message: 'New password must be different from your current password'
      };
    }

    // Hash new password
    const newPasswordHash = await hash(newPassword, BCRYPT_ROUNDS);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date(),
        // Reset failed login attempts on password reset
        failedLoginAttempts: 0,
        lockedUntil: null,
      }
    });

    // Log security event
    await prisma.securityLog.create({
      data: {
        userId: user.id,
        event: 'PASSWORD_RESET_COMPLETED',
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
        metadata: {}
      }
    });

    // Send confirmation email
    try {
      await EmailHelpers.sendPasswordChangeConfirmation(user.email, {
        userName: user.email.split('@')[0],
        changedAt: new Date().toLocaleString(),
        ipAddress: ipAddress || 'Unknown',
      }, {
        userId: user.id,
        priority: 'urgent',
      });
    } catch (error) {
      console.error('Failed to send password change confirmation:', error);
      // Don't fail the password reset if email fails
    }

    // Invalidate all existing sessions for this user
    // This forces re-authentication with the new password
    await this.invalidateUserSessions(user.id);

    return {
      success: true,
      message: 'Password has been successfully reset. Please log in with your new password.'
    };
  }

  /**
   * Invalidate all user sessions (force re-login)
   */
  private static async invalidateUserSessions(userId: string): Promise<void> {
    // In a real implementation, this would:
    // 1. Clear all JWT tokens for the user
    // 2. Update a session version in the user record
    // 3. Clear any active refresh tokens
    
    // For now, we'll update a field that can be checked during auth
    await prisma.user.update({
      where: { id: userId },
      data: {
        sessionVersion: { increment: 1 }
      }
    });
  }

  /**
   * Check if a reset token is valid without using it
   */
  static async validateResetToken(token: string): Promise<boolean> {
    if (!token || token.length < 32) {
      return false;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date()
        }
      },
      select: { id: true }
    });

    return !!user;
  }
}

// Import compare function
import { compare } from 'bcryptjs';