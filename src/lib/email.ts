import { Resend } from 'resend';
import {
  emailSecurityValidator,
  emailAddressSchema,
  emailSubjectSchema,
  emailRecipientsSchema,
  EMAIL_SECURITY_CONFIG,
} from './email/security';
import { SecurityLogger } from './security/security-monitor';

// Validate environment variables (but allow build-time flexibility)
if (
  process.env.NODE_ENV !== 'development' ||
  process.env.NEXT_PHASE !== 'phase-production-build'
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY environment variable is not set');
  }

  if (!process.env.RESEND_EMAIL_FROM) {
    console.warn('RESEND_EMAIL_FROM environment variable is not set');
  } else {
    // Validate FROM email address at runtime only
    try {
      const fromEmailValidation = emailSecurityValidator.validateEmailAddress(
        process.env.RESEND_EMAIL_FROM
      );
      if (!fromEmailValidation.isValid) {
        console.warn(
          `FROM email address may be invalid: ${fromEmailValidation.errors.join(', ')}`
        );
      }
    } catch (error) {
      console.warn('Email validation error:', error);
    }
  }
}

// Initialize Resend client lazily to avoid build-time connection
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Export for backward compatibility
export const resend = {
  get emails() {
    return getResendClient().emails;
  }
};

// Email configuration
export const emailConfig = {
  from: process.env.RESEND_EMAIL_FROM,
  apiKey: process.env.RESEND_API_KEY,
  isDevelopment: process.env.NODE_ENV === 'development',
  domain: process.env.DOMAIN || 'localhost',
};

// Enhanced email sending interface
export interface SecureEmailOptions {
  to: string | string[];
  subject: string;
  react?: React.ReactElement;
  html?: string;
  text?: string;
  userId?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  skipValidation?: boolean; // For internal system emails only
  metadata?: Record<string, any>;
}

// Secure email sending wrapper with comprehensive validation
export async function sendEmail(options: SecureEmailOptions) {
  const startTime = Date.now();
  const {
    to,
    subject,
    react,
    html,
    text,
    userId,
    priority = 'normal',
    skipValidation = false,
    metadata,
  } = options;

  try {
    // Runtime validation of email configuration
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    if (!process.env.RESEND_EMAIL_FROM) {
      throw new Error('RESEND_EMAIL_FROM environment variable is required');
    }

    // Validate FROM email address at runtime
    const fromEmailValidation = emailSecurityValidator.validateEmailAddress(
      process.env.RESEND_EMAIL_FROM
    );
    if (!fromEmailValidation.isValid) {
      throw new Error(
        `Invalid FROM email address: ${fromEmailValidation.errors.join(', ')}`
      );
    }

    // Convert to array for consistent handling
    const recipients = Array.isArray(to) ? to : [to];
    const clientIp = metadata?.clientIp || 'unknown';

    // Security validation (unless explicitly skipped for system emails)
    if (!skipValidation) {
      // Validate recipients
      const recipientsValidation = emailRecipientsSchema.safeParse(recipients);
      if (!recipientsValidation.success) {
        const error = new Error(
          `Invalid recipients: ${recipientsValidation.error.message}`
        );
        SecurityLogger.suspiciousRequest(
          clientIp,
          'Invalid email recipients',
          { recipients, errors: recipientsValidation.error.errors },
          userId
        );
        throw error;
      }

      // Validate subject
      const subjectValidation = emailSecurityValidator.validateSubject(subject);
      if (!subjectValidation.isValid) {
        const error = new Error(
          `Invalid subject: ${subjectValidation.errors.join(', ')}`
        );
        SecurityLogger.suspiciousRequest(
          clientIp,
          'Invalid email subject',
          { subject, errors: subjectValidation.errors },
          userId
        );
        throw error;
      }

      // Rate limiting check
      const rateLimitKey = userId || clientIp;
      const rateLimitCheck =
        emailSecurityValidator.checkRateLimit(rateLimitKey);
      if (!rateLimitCheck.allowed) {
        const error = new Error('Rate limit exceeded for email sending');
        SecurityLogger.rateLimitExceeded(clientIp, 'email-send', userId);
        throw error;
      }

      // Sanitize HTML content if provided (but skip for React components)
      if (html && !react) {
        const sanitizedHtml = emailSecurityValidator.sanitizeHtmlContent(html);
        if (sanitizedHtml !== html) {
          console.warn('[EMAIL-SECURITY] HTML content was sanitized');
          SecurityLogger.suspiciousRequest(
            clientIp,
            'Email HTML content sanitized',
            {
              originalLength: html.length,
              sanitizedLength: sanitizedHtml.length,
            },
            userId
          );
        }
        options.html = sanitizedHtml;
      } else if (html && react) {
        // Trust React component generated HTML
        options.html = html;
      }
    }

    // Use validated FROM address
    const fromAddress = process.env.RESEND_EMAIL_FROM;

    // Generate secure headers
    const secureHeaders = emailSecurityValidator.generateSecureHeaders(
      fromAddress,
      recipients,
      subject
    );

    // Prepare email data
    const emailData = {
      from: fromAddress,
      to: recipients,
      subject,
      react,
      html: options.html,
      text,
      headers: secureHeaders,
      tags: [
        { name: 'priority', value: priority },
        { name: 'environment', value: process.env.NODE_ENV || 'development' },
        { name: 'source', value: '209jobs' },
      ],
    };

    // Send email
    const result = await resend.emails.send(emailData);

    // Log successful send
    const processingTime = Date.now() - startTime;
    if (emailConfig.isDevelopment) {
      console.log(
        `[EMAIL] Successfully sent to ${recipients.join(', ')} in ${processingTime}ms:`,
        result
      );
    }

    // Security logging for successful sends
    SecurityLogger.loginSuccess(
      userId || 'system',
      clientIp,
      `Email sent successfully: ${subject}`
    );

    return {
      success: true,
      data: result,
      processingTime,
      recipients: recipients.length,
      messageId: result.data?.id || 'unknown',
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    console.error(`[EMAIL] Failed to send email in ${processingTime}ms:`, {
      error: errorMessage,
      to: Array.isArray(to) ? to : [to],
      subject,
      userId,
      metadata,
    });

    // Security logging for failed sends
    SecurityLogger.suspiciousRequest(
      metadata?.clientIp || 'unknown',
      'Email sending failed',
      {
        error: errorMessage,
        subject,
        recipients: Array.isArray(to) ? to : [to],
      },
      userId
    );

    return {
      success: false,
      error: errorMessage,
      processingTime,
      code: getErrorCode(error),
    };
  }
}

// Legacy function for backward compatibility (with security warnings)
export async function sendEmailLegacy({
  to,
  subject,
  react,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  react?: React.ReactElement;
  html?: string;
  text?: string;
}) {
  console.warn(
    '[EMAIL-SECURITY] Using legacy sendEmail function - consider upgrading to secure version'
  );

  return sendEmail({
    to,
    subject,
    react,
    html,
    text,
    skipValidation: true, // Legacy mode skips validation for compatibility
    metadata: { source: 'legacy' },
  });
}

// Email validation utilities
export function validateEmailAddress(email: string): {
  isValid: boolean;
  errors: string[];
} {
  return emailSecurityValidator.validateEmailAddress(email);
}

export function validateEmailSubject(subject: string): {
  isValid: boolean;
  errors: string[];
} {
  return emailSecurityValidator.validateSubject(subject);
}

export function sanitizeEmailContent(html: string): string {
  return emailSecurityValidator.sanitizeHtmlContent(html);
}

// Email security configuration export
export { EMAIL_SECURITY_CONFIG } from './email/security';

// Error code mapping
function getErrorCode(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('Rate limit')) return 'RATE_LIMIT_EXCEEDED';
    if (error.message.includes('Invalid recipients'))
      return 'INVALID_RECIPIENTS';
    if (error.message.includes('Invalid subject')) return 'INVALID_SUBJECT';
    if (error.message.includes('API key')) return 'AUTHENTICATION_ERROR';
    if (error.message.includes('quota')) return 'QUOTA_EXCEEDED';
  }
  return 'EMAIL_SEND_ERROR';
}
