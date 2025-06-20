import { prisma } from '@/components/ui/card';
import { NextRequest } from 'next/server';


export enum SecurityEvent {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',
  TWO_FACTOR_SUCCESS = 'TWO_FACTOR_SUCCESS',
  TWO_FACTOR_FAILED = 'TWO_FACTOR_FAILED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SESSION_INVALIDATED = 'SESSION_INVALIDATED',
  ADMIN_ACTION = 'ADMIN_ACTION',
}

// Rate limiting configuration
export const RATE_LIMITS = {
  PASSWORD_RESET: { attempts: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5 per day
  LOGIN_ATTEMPTS: { attempts: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes
  TWO_FACTOR_ATTEMPTS: { attempts: 3, windowMs: 5 * 60 * 1000 }, // 3 per 5 minutes
  EMAIL_VERIFICATION: { attempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
} as const;

export class SecurityUtils {
  /**
   * Log security events with standardized format
   */
  static async logSecurityEvent(
    userId: string,
    event: SecurityEvent,
    metadata: Record<string, any> = {},
    request?: NextRequest
  ): Promise<void> {
    try {
      let ipAddress = 'unknown';
      let userAgent = 'unknown';

      if (request) {
        const { ipAddress: ip, userAgent: ua } = this.extractRequestInfo(request);
        ipAddress = ip;
        userAgent = ua;
      }

      await prisma.securityLog.create({
        data: {
          userId,
          event,
          ipAddress,
          userAgent,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
          }
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  /**
   * Extract IP address and user agent from request
   */
  static extractRequestInfo(request: NextRequest): { ipAddress: string; userAgent: string } {
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     request.headers.get('cf-connecting-ip') ||
                     'unknown';

    const userAgent = request.headers.get('user-agent') || 'unknown';

    return { ipAddress, userAgent };
  }

  /**
   * Check rate limiting for various security actions
   */
  static async checkRateLimit(
    identifier: string, // email, IP, or userId
    action: keyof typeof RATE_LIMITS,
    additionalFilters: Record<string, any> = {}
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const config = RATE_LIMITS[action];
    const windowStart = new Date(Date.now() - config.windowMs);

    try {
      const count = await prisma.securityLog.count({
        where: {
          createdAt: { gte: windowStart },
          OR: [
            { user: { email: identifier } },
            { ipAddress: identifier },
            { userId: identifier }
          ],
          ...additionalFilters
        }
      });

      const remaining = Math.max(0, config.attempts - count);
      const resetTime = new Date(Date.now() + config.windowMs);

      return {
        allowed: count < config.attempts,
        remaining,
        resetTime
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Allow on error to avoid blocking legitimate users
      return {
        allowed: true,
        remaining: config.attempts,
        resetTime: new Date(Date.now() + config.windowMs)
      };
    }
  }

  /**
   * Generate cryptographically secure token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Hash a token for storage
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Check if an account should be locked based on failed attempts
   */
  static async checkAccountLockout(userId: string): Promise<{
    isLocked: boolean;
    lockoutExpires?: Date;
    attemptsRemaining: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        failedLoginAttempts: true,
        lockedUntil: true
      }
    });

    if (!user) {
      return { isLocked: false, attemptsRemaining: 0 };
    }

    // Check if currently locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      return {
        isLocked: true,
        lockoutExpires: user.lockedUntil,
        attemptsRemaining: 0
      };
    }

    // If lockout period has passed, reset attempts
    if (user.lockedUntil && new Date() >= user.lockedUntil) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });
      return { isLocked: false, attemptsRemaining: 5 };
    }

    const maxAttempts = 5;
    const attemptsRemaining = maxAttempts - (user.failedLoginAttempts || 0);

    return {
      isLocked: false,
      attemptsRemaining: Math.max(0, attemptsRemaining)
    };
  }

  /**
   * Lock an account after too many failed attempts
   */
  static async lockAccount(userId: string, durationMinutes: number = 15): Promise<void> {
    const lockUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: lockUntil,
        failedLoginAttempts: 5 // Max attempts reached
      }
    });

    await this.logSecurityEvent(userId, SecurityEvent.ACCOUNT_LOCKED, {
      lockDuration: durationMinutes,
      lockUntil: lockUntil.toISOString()
    });
  }

  /**
   * Increment failed login attempts
   */
  static async incrementFailedAttempts(userId: string): Promise<{
    newAttemptCount: number;
    shouldLock: boolean;
  }> {
    const dbUser = await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 }
      },
      select: {
        failedLoginAttempts: true
      }
    });

    const maxAttempts = 5;
    const shouldLock = user.failedLoginAttempts >= maxAttempts;

    if (shouldLock) {
      await this.lockAccount(userId);
    }

    return {
      newAttemptCount: user.failedLoginAttempts,
      shouldLock
    };
  }

  /**
   * Reset failed login attempts on successful authentication
   */
  static async resetFailedAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number; // 0-4
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 1;
    }

    // Character variety
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasLower) errors.push('Password must contain lowercase letters');
    if (!hasUpper) errors.push('Password must contain uppercase letters');
    if (!hasNumbers) errors.push('Password must contain numbers');
    if (!hasSpecial) errors.push('Password must contain special characters');

    const varietyCount = [hasLower, hasUpper, hasNumbers, hasSpecial].filter(Boolean).length;
    score += Math.max(0, varietyCount - 2);

    // Common patterns
    const commonPatterns = [
      /123456/, /password/, /qwerty/, /abc123/, /admin/, /letmein/
    ];
    
    if (commonPatterns.some(pattern => pattern.test(password.toLowerCase()))) {
      errors.push('Password contains common patterns');
      suggestions.push('Avoid common words and sequences');
    }

    // Entropy check (simple)
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.8) {
      score += 1;
    }

    if (password.length >= 16) {
      score += 1;
    }

    return {
      isValid: errors.length === 0 && score >= 2,
      score: Math.min(4, score),
      errors,
      suggestions
    };
  }

  /**
   * Generate backup codes for 2FA
   */
  static generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Check for suspicious login patterns
   */
  static async detectSuspiciousActivity(
    userId: string,
    currentRequest: { ipAddress: string; userAgent: string }
  ): Promise<{ suspicious: boolean; reasons: string[] }> {
    const reasons: string[] = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    try {
      // Check recent logins from different IPs
      const recentLogins = await prisma.securityLog.findMany({
        where: {
          userId,
          event: SecurityEvent.LOGIN_SUCCESS,
          createdAt: { gte: oneHourAgo }
        },
        select: {
          ipAddress: true,
          userAgent: true
        }
      });

      const uniqueIPs = new Set(recentLogins.map(log => log.ipAddress));
      
      if (uniqueIPs.size > 2) {
        reasons.push('Multiple IP addresses in short timeframe');
      }

      // Check for rapid succession logins
      if (recentLogins.length > 10) {
        reasons.push('Unusually high login frequency');
      }

      // Check for completely different user agent
      const recentUserAgents = recentLogins.map(log => log.userAgent);
      const currentUA = currentRequest.userAgent.toLowerCase();
      
      const hasSimilarUA = recentUserAgents.some(ua => {
        const similarity = this.calculateStringSimilarity(ua.toLowerCase(), currentUA);
        return similarity > 0.5;
      });

      if (recentUserAgents.length > 0 && !hasSimilarUA) {
        reasons.push('Significantly different browser/device');
      }

      return {
        suspicious: reasons.length > 0,
        reasons
      };
    } catch (error) {
      console.error('Suspicious activity detection failed:', error);
      return { suspicious: false, reasons: [] };
    }
  }

  /**
   * Calculate string similarity (simple Jaccard index)
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.split(''));
    const set2 = new Set(str2.split(''));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Clean up old security logs
   */
  static async cleanupOldSecurityLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await prisma.securityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });

    return result.count;
  }
}

export default SecurityUtils;