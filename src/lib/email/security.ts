import { z } from 'zod';
import validator from 'validator';

// Safe HTML sanitization for email content
function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return '';

  // For email templates, we need to preserve HTML structure
  // Only remove dangerous scripts and event handlers
  return html
    .replace(/javascript:/gi, '')
    .replace(/data:(?!image\/)/gi, '') // Allow data: images but not other data: URIs
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick, onload, etc.
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embed tags
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '') // Remove form tags
    .replace(/<input\b[^>]*>/gi, '') // Remove input tags
    .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, '') // Remove textarea tags
    .replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, ''); // Remove select tags
}

// Email security configuration
export const EMAIL_SECURITY_CONFIG = {
  // Maximum email sizes
  MAX_SUBJECT_LENGTH: 200,
  MAX_BODY_LENGTH: 100000, // 100KB
  MAX_RECIPIENTS: 50,
  MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024, // 10MB

  // Rate limiting
  MAX_EMAILS_PER_MINUTE: 10,
  MAX_EMAILS_PER_HOUR: 100,
  MAX_EMAILS_PER_DAY: 1000,

  // Content filtering
  BLOCKED_DOMAINS: [
    'tempmail.org',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
  ],

  // Security headers
  REQUIRED_HEADERS: ['Message-ID', 'Date', 'From', 'To'],
  FORBIDDEN_HEADERS: ['Bcc', 'X-Priority', 'X-MSMail-Priority'],

  // Content security
  ALLOWED_HTML_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'div',
    'span',
    'table',
    'tr',
    'td',
    'th',
  ],
  ALLOWED_ATTRIBUTES: {
    a: ['href', 'title'],
    img: ['src', 'alt', 'width', 'height'],
    '*': ['style', 'class'],
  },
};

// Email validation schemas
export const emailAddressSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email too short')
  .max(254, 'Email too long')
  .transform(email => email.toLowerCase())
  .refine(email => {
    // Additional validation beyond basic email format
    const domain = email.split('@')[1];
    return !EMAIL_SECURITY_CONFIG.BLOCKED_DOMAINS.includes(domain);
  }, 'Email domain not allowed')
  .refine(email => {
    // Check for homograph attacks
    return !containsHomographs(email);
  }, 'Email contains suspicious characters');

export const emailSubjectSchema = z
  .string()
  .min(1, 'Subject is required')
  .max(EMAIL_SECURITY_CONFIG.MAX_SUBJECT_LENGTH, 'Subject too long')
  .refine(subject => {
    // Check for header injection
    return !containsHeaderInjection(subject);
  }, 'Subject contains invalid characters');

export const emailBodySchema = z
  .string()
  .max(EMAIL_SECURITY_CONFIG.MAX_BODY_LENGTH, 'Email body too long')
  .refine(body => {
    // Check for suspicious content
    return !containsSuspiciousContent(body);
  }, 'Email body contains suspicious content');

export const emailRecipientsSchema = z
  .array(emailAddressSchema)
  .min(1, 'At least one recipient required')
  .max(EMAIL_SECURITY_CONFIG.MAX_RECIPIENTS, 'Too many recipients');

// Email security validator class
export class EmailSecurityValidator {
  private static instance: EmailSecurityValidator;
  private rateLimitStore = new Map<
    string,
    { count: number; resetTime: number }
  >();

  public static getInstance(): EmailSecurityValidator {
    if (!EmailSecurityValidator.instance) {
      EmailSecurityValidator.instance = new EmailSecurityValidator();
    }
    return EmailSecurityValidator.instance;
  }

  /**
   * Validate email address with comprehensive security checks
   */
  public validateEmailAddress(email: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // Extract email from RFC 5322 format if needed (e.g., "<email@domain.com>")
      let cleanEmail = email.trim();
      if (cleanEmail.startsWith('<') && cleanEmail.endsWith('>')) {
        cleanEmail = cleanEmail.slice(1, -1);
      }

      // Basic format validation
      if (!validator.isEmail(cleanEmail)) {
        errors.push('Invalid email format');
      }

      // Length validation
      if (cleanEmail.length > 254) {
        errors.push('Email address too long');
      }

      // Domain validation
      const domain = cleanEmail.split('@')[1];
      if (domain && EMAIL_SECURITY_CONFIG.BLOCKED_DOMAINS.includes(domain)) {
        errors.push('Email domain not allowed');
      }

      // Check for homograph attacks
      if (containsHomographs(cleanEmail)) {
        errors.push('Email contains suspicious characters');
      }

      // Check for header injection
      if (containsHeaderInjection(cleanEmail)) {
        errors.push('Email contains invalid characters');
      }

      // Validate domain exists (basic check)
      if (domain && !this.isValidDomain(domain)) {
        errors.push('Invalid email domain');
      }
    } catch (error) {
      errors.push('Email validation failed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email subject for security issues
   */
  public validateSubject(subject: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // Length validation
      if (subject.length > EMAIL_SECURITY_CONFIG.MAX_SUBJECT_LENGTH) {
        errors.push('Subject too long');
      }

      // Header injection check
      if (containsHeaderInjection(subject)) {
        errors.push('Subject contains invalid characters');
      }

      // Check for suspicious content
      if (containsSuspiciousContent(subject)) {
        errors.push('Subject contains suspicious content');
      }
    } catch (error) {
      errors.push('Subject validation failed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize HTML content for email
   */
  public sanitizeHtmlContent(html: string): string {
    try {
      return sanitizeHtml(html);
    } catch (error) {
      console.error('HTML sanitization failed:', error);
      return ''; // Return empty string if sanitization fails
    }
  }

  /**
   * Validate email headers for security
   */
  public validateHeaders(headers: Record<string, string>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // Check for required headers
      for (const requiredHeader of EMAIL_SECURITY_CONFIG.REQUIRED_HEADERS) {
        if (!headers[requiredHeader]) {
          errors.push(`Missing required header: ${requiredHeader}`);
        }
      }

      // Check for forbidden headers
      for (const forbiddenHeader of EMAIL_SECURITY_CONFIG.FORBIDDEN_HEADERS) {
        if (headers[forbiddenHeader]) {
          errors.push(`Forbidden header present: ${forbiddenHeader}`);
        }
      }

      // Validate header values
      for (const [key, value] of Object.entries(headers)) {
        if (containsHeaderInjection(value)) {
          errors.push(`Header injection detected in ${key}`);
        }
      }
    } catch (error) {
      errors.push('Header validation failed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check rate limits for email sending
   */
  public checkRateLimit(identifier: string): {
    allowed: boolean;
    resetTime?: number;
  } {
    const now = Date.now();
    const key = `email_rate_${identifier}`;
    const limit = this.rateLimitStore.get(key);

    if (!limit || now > limit.resetTime) {
      // Reset or initialize rate limit
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + 60 * 1000, // 1 minute window
      });
      return { allowed: true };
    }

    if (limit.count >= EMAIL_SECURITY_CONFIG.MAX_EMAILS_PER_MINUTE) {
      return { allowed: false, resetTime: limit.resetTime };
    }

    // Increment count
    limit.count++;
    this.rateLimitStore.set(key, limit);
    return { allowed: true };
  }

  /**
   * Validate file attachments
   */
  public validateAttachment(file: {
    name: string;
    size: number;
    type: string;
    content: Buffer;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Size validation
      if (file.size > EMAIL_SECURITY_CONFIG.MAX_ATTACHMENT_SIZE) {
        errors.push('Attachment too large');
      }

      // File name validation
      if (containsPathTraversal(file.name)) {
        errors.push('Invalid file name');
      }

      // MIME type validation
      if (!isAllowedMimeType(file.type)) {
        errors.push('File type not allowed');
      }

      // Content validation (basic virus scan)
      if (containsMaliciousContent(file.content)) {
        errors.push('File contains suspicious content');
      }
    } catch (error) {
      errors.push('Attachment validation failed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate secure email headers
   */
  public generateSecureHeaders(
    from: string,
    to: string[],
    subject: string
  ): Record<string, string> {
    const messageId = `<${Date.now()}.${Math.random().toString(36)}@${process.env.DOMAIN || 'localhost'}>`;

    return {
      'Message-ID': messageId,
      Date: new Date().toUTCString(),
      From: from,
      To: to.join(', '),
      Subject: subject,
      'X-Mailer': '209jobs-secure-mailer',
      'X-Priority': '3', // Normal priority
      'MIME-Version': '1.0',
      'Content-Type': 'text/html; charset=UTF-8',
      'Content-Transfer-Encoding': '8bit',
    };
  }

  /**
   * Basic domain validation
   */
  private isValidDomain(domain: string): boolean {
    try {
      // Basic domain format check
      const domainRegex =
        /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return domainRegex.test(domain) && domain.length <= 253;
    } catch {
      return false;
    }
  }
}

// Security utility functions
function containsHeaderInjection(value: string): boolean {
  // Check for CRLF injection and header manipulation
  const injectionPatterns = [
    /\r\n/g, // CRLF
    /\n/g, // LF
    /\r/g, // CR
    /%0[aA]/g, // URL encoded LF
    /%0[dD]/g, // URL encoded CR
    /%0[dD]%0[aA]/g, // URL encoded CRLF
    /\x00/g, // Null byte
  ];

  return injectionPatterns.some(pattern => pattern.test(value));
}

function containsHomographs(text: string): boolean {
  // Check for homograph attacks (similar looking characters)
  const suspiciousChars = /[а-я]|[α-ω]|[а-я]|[\u0400-\u04FF]|[\u0370-\u03FF]/;
  return suspiciousChars.test(text);
}

function containsSuspiciousContent(content: string): boolean {
  const suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
    /on\w+\s*=/i, // Event handlers
    /expression\s*\(/i, // CSS expressions
    /import\s+/i, // ES6 imports
    /eval\s*\(/i, // eval() calls
  ];

  return suspiciousPatterns.some(pattern => pattern.test(content));
}

function containsPathTraversal(filename: string): boolean {
  const pathTraversalPatterns = [/\.\./, /\//, /\\/, /%2e%2e/i, /%2f/i, /%5c/i];

  return pathTraversalPatterns.some(pattern => pattern.test(filename));
}

function isAllowedMimeType(mimeType: string): boolean {
  const allowedTypes = [
    'text/plain',
    'text/html',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  return allowedTypes.includes(mimeType);
}

function containsMaliciousContent(content: Buffer): boolean {
  // Basic malware signature detection
  const maliciousSignatures = [
    Buffer.from('4D5A', 'hex'), // PE executable
    Buffer.from('7F454C46', 'hex'), // ELF executable
    Buffer.from('504B0304', 'hex'), // ZIP file (could contain malware)
  ];

  return maliciousSignatures.some(
    signature => content.indexOf(signature) !== -1
  );
}

// Email authentication utilities
export class EmailAuthenticator {
  /**
   * Generate DKIM signature (placeholder - requires proper DKIM implementation)
   */
  public static generateDKIMSignature(
    headers: Record<string, string>,
    body: string,
    privateKey: string
  ): string {
    // This is a placeholder - implement proper DKIM signing
    // using a library like 'dkim-signer' in production
    console.warn('DKIM signing not implemented - use proper DKIM library');
    return '';
  }

  /**
   * Validate SPF record (placeholder - requires DNS lookup)
   */
  public static async validateSPF(
    domain: string,
    ip: string
  ): Promise<boolean> {
    // This is a placeholder - implement proper SPF validation
    // using DNS TXT record lookup in production
    console.warn('SPF validation not implemented - use proper SPF library');
    return true;
  }

  /**
   * Generate DMARC policy (placeholder)
   */
  public static generateDMARCPolicy(): string {
    return 'v=DMARC1; p=quarantine; rua=mailto:dmarc@209.works';
  }
}

// Export singleton instance
export const emailSecurityValidator = EmailSecurityValidator.getInstance();
