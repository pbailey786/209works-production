import {
  EmailSecurityValidator,
  emailSecurityValidator,
  emailAddressSchema,
  emailSubjectSchema,
  emailRecipientsSchema,
  EMAIL_SECURITY_CONFIG,
} from '../security';

describe('EmailSecurityValidator', () => {
  let validator: EmailSecurityValidator;

  beforeEach(() => {
    validator = EmailSecurityValidator.getInstance();
  });

  describe('validateEmailAddress', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];

      validEmails.forEach(email => {
        const result = validator.validateEmailAddress(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
      ];

      invalidEmails.forEach(email => {
        const result = validator.validateEmailAddress(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should reject blocked domains', () => {
      const blockedEmails = [
        'test@tempmail.org',
        'user@10minutemail.com',
        'spam@guerrillamail.com',
      ];

      blockedEmails.forEach(email => {
        const result = validator.validateEmailAddress(email);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Email domain not allowed');
      });
    });

    it('should detect header injection attempts', () => {
      const maliciousEmails = [
        'test@example.com\r\nBcc: hacker@evil.com',
        'user@domain.com\nSubject: Injected',
        'test@example.com%0ABcc: evil@hacker.com',
      ];

      maliciousEmails.forEach(email => {
        const result = validator.validateEmailAddress(email);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Email contains invalid characters');
      });
    });

    it('should detect homograph attacks', () => {
      const homographEmails = [
        'tеst@example.com', // Cyrillic 'е' instead of 'e'
        'usеr@domain.com', // Mixed characters
      ];

      homographEmails.forEach(email => {
        const result = validator.validateEmailAddress(email);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Email contains suspicious characters');
      });
    });
  });

  describe('validateSubject', () => {
    it('should validate normal subjects', () => {
      const validSubjects = [
        'Welcome to 209jobs!',
        'Your job alert for Software Developer',
        'Password reset request',
      ];

      validSubjects.forEach(subject => {
        const result = validator.validateSubject(subject);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject subjects that are too long', () => {
      const longSubject = 'A'.repeat(
        EMAIL_SECURITY_CONFIG.MAX_SUBJECT_LENGTH + 1
      );
      const result = validator.validateSubject(longSubject);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Subject too long');
    });

    it('should detect header injection in subjects', () => {
      const maliciousSubjects = [
        'Normal Subject\r\nBcc: hacker@evil.com',
        'Subject\nX-Priority: 1',
        'Test%0ABcc: evil@hacker.com',
      ];

      maliciousSubjects.forEach(subject => {
        const result = validator.validateSubject(subject);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Subject contains invalid characters');
      });
    });

    it('should detect suspicious content in subjects', () => {
      const suspiciousSubjects = [
        'Click here: javascript:alert("xss")',
        'Evil script: <script>alert("hack")</script>',
        'Data URI: data:text/html,<script>alert(1)</script>',
      ];

      suspiciousSubjects.forEach(subject => {
        const result = validator.validateSubject(subject);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Subject contains suspicious content');
      });
    });
  });

  describe('sanitizeHtmlContent', () => {
    it('should preserve safe HTML', () => {
      const safeHtml = '<p>Hello <strong>world</strong>!</p>';
      const result = validator.sanitizeHtmlContent(safeHtml);

      expect(result).toBe(safeHtml);
    });

    it('should remove dangerous scripts', () => {
      const dangerousHtml = '<p>Hello</p><script>alert("xss")</script>';
      const result = validator.sanitizeHtmlContent(dangerousHtml);

      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Hello</p>');
    });

    it('should remove event handlers', () => {
      const maliciousHtml = '<div onclick="alert(\'xss\')">Click me</div>';
      const result = validator.sanitizeHtmlContent(maliciousHtml);

      expect(result).not.toContain('onclick');
      expect(result).toContain('<div>Click me</div>');
    });

    it('should remove dangerous protocols', () => {
      const dangerousHtml = '<a href="javascript:alert(\'xss\')">Link</a>';
      const result = validator.sanitizeHtmlContent(dangerousHtml);

      expect(result).not.toContain('javascript:');
    });
  });

  describe('validateHeaders', () => {
    it('should validate proper headers', () => {
      const validHeaders = {
        'Message-ID': '<123@example.com>',
        Date: 'Mon, 01 Jan 2024 12:00:00 GMT',
        From: 'sender@example.com',
        To: 'recipient@example.com',
        Subject: 'Test Email',
      };

      const result = validator.validateHeaders(validHeaders);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required headers', () => {
      const incompleteHeaders = {
        From: 'sender@example.com',
        To: 'recipient@example.com',
        // Missing Message-ID, Date, Subject
      };

      const result = validator.validateHeaders(incompleteHeaders);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect forbidden headers', () => {
      const forbiddenHeaders = {
        'Message-ID': '<123@example.com>',
        Date: 'Mon, 01 Jan 2024 12:00:00 GMT',
        From: 'sender@example.com',
        To: 'recipient@example.com',
        Subject: 'Test Email',
        Bcc: 'hidden@example.com', // Forbidden
      };

      const result = validator.validateHeaders(forbiddenHeaders);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Forbidden header present: Bcc');
    });

    it('should detect header injection', () => {
      const maliciousHeaders = {
        'Message-ID': '<123@example.com>',
        Date: 'Mon, 01 Jan 2024 12:00:00 GMT',
        From: 'sender@example.com',
        To: 'recipient@example.com',
        Subject: 'Test\r\nBcc: hacker@evil.com', // Header injection
      };

      const result = validator.validateHeaders(maliciousHeaders);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error => error.includes('Header injection'))
      ).toBe(true);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow emails within rate limit', () => {
      const identifier = 'test-user-1';

      for (let i = 0; i < EMAIL_SECURITY_CONFIG.MAX_EMAILS_PER_MINUTE; i++) {
        const result = validator.checkRateLimit(identifier);
        expect(result.allowed).toBe(true);
      }
    });

    it('should block emails exceeding rate limit', () => {
      const identifier = 'test-user-2';

      // Fill up the rate limit
      for (let i = 0; i < EMAIL_SECURITY_CONFIG.MAX_EMAILS_PER_MINUTE; i++) {
        validator.checkRateLimit(identifier);
      }

      // Next request should be blocked
      const result = validator.checkRateLimit(identifier);
      expect(result.allowed).toBe(false);
      expect(result.resetTime).toBeDefined();
    });

    it('should reset rate limit after time window', async () => {
      const identifier = 'test-user-3';

      // Mock time to test reset
      const originalNow = Date.now;
      let mockTime = Date.now();
      Date.now = jest.fn(() => mockTime);

      // Fill up rate limit
      for (let i = 0; i < EMAIL_SECURITY_CONFIG.MAX_EMAILS_PER_MINUTE; i++) {
        validator.checkRateLimit(identifier);
      }

      // Should be blocked
      expect(validator.checkRateLimit(identifier).allowed).toBe(false);

      // Advance time past reset window
      mockTime += 61 * 1000; // 61 seconds

      // Should be allowed again
      const result = validator.checkRateLimit(identifier);
      expect(result.allowed).toBe(true);

      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('validateAttachment', () => {
    it('should validate safe attachments', () => {
      const safeFile = {
        name: 'document.pdf',
        size: 1024 * 1024, // 1MB
        type: 'application/pdf',
        content: Buffer.from('PDF content'),
      };

      const result = validator.validateAttachment(safeFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject oversized attachments', () => {
      const largeFile = {
        name: 'large.pdf',
        size: EMAIL_SECURITY_CONFIG.MAX_ATTACHMENT_SIZE + 1,
        type: 'application/pdf',
        content: Buffer.from('content'),
      };

      const result = validator.validateAttachment(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Attachment too large');
    });

    it('should reject files with path traversal', () => {
      const maliciousFile = {
        name: '../../../etc/passwd',
        size: 1024,
        type: 'text/plain',
        content: Buffer.from('content'),
      };

      const result = validator.validateAttachment(maliciousFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid file name');
    });

    it('should reject disallowed file types', () => {
      const executableFile = {
        name: 'virus.exe',
        size: 1024,
        type: 'application/x-executable',
        content: Buffer.from('content'),
      };

      const result = validator.validateAttachment(executableFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File type not allowed');
    });

    it('should detect malicious content signatures', () => {
      const maliciousFile = {
        name: 'file.txt',
        size: 1024,
        type: 'text/plain',
        content: Buffer.from('4D5A', 'hex'), // PE executable signature
      };

      const result = validator.validateAttachment(maliciousFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File contains suspicious content');
    });
  });

  describe('generateSecureHeaders', () => {
    it('should generate all required headers', () => {
      const from = 'sender@example.com';
      const to = ['recipient@example.com'];
      const subject = 'Test Email';

      const headers = validator.generateSecureHeaders(from, to, subject);

      expect(headers['Message-ID']).toBeDefined();
      expect(headers['Date']).toBeDefined();
      expect(headers['From']).toBe(from);
      expect(headers['To']).toBe(to.join(', '));
      expect(headers['Subject']).toBe(subject);
      expect(headers['X-Mailer']).toBe('209jobs-secure-mailer');
      expect(headers['MIME-Version']).toBe('1.0');
    });

    it('should generate unique message IDs', () => {
      const from = 'sender@example.com';
      const to = ['recipient@example.com'];
      const subject = 'Test Email';

      const headers1 = validator.generateSecureHeaders(from, to, subject);
      const headers2 = validator.generateSecureHeaders(from, to, subject);

      expect(headers1['Message-ID']).not.toBe(headers2['Message-ID']);
    });
  });
});

describe('Email Schema Validation', () => {
  describe('emailAddressSchema', () => {
    it('should validate correct emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];

      validEmails.forEach(email => {
        expect(() => emailAddressSchema.parse(email)).not.toThrow();
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'invalid-email',
        'test@tempmail.org', // Blocked domain
        'tеst@example.com', // Homograph
      ];

      invalidEmails.forEach(email => {
        expect(() => emailAddressSchema.parse(email)).toThrow();
      });
    });
  });

  describe('emailSubjectSchema', () => {
    it('should validate normal subjects', () => {
      const validSubjects = ['Welcome!', 'Your job alert', 'Password reset'];

      validSubjects.forEach(subject => {
        expect(() => emailSubjectSchema.parse(subject)).not.toThrow();
      });
    });

    it('should reject invalid subjects', () => {
      const invalidSubjects = [
        '', // Empty
        'A'.repeat(EMAIL_SECURITY_CONFIG.MAX_SUBJECT_LENGTH + 1), // Too long
        'Subject\r\nBcc: evil@hacker.com', // Header injection
      ];

      invalidSubjects.forEach(subject => {
        expect(() => emailSubjectSchema.parse(subject)).toThrow();
      });
    });
  });

  describe('emailRecipientsSchema', () => {
    it('should validate recipient arrays', () => {
      const validRecipients = [
        ['test@example.com'],
        ['user1@example.com', 'user2@example.com'],
      ];

      validRecipients.forEach(recipients => {
        expect(() => emailRecipientsSchema.parse(recipients)).not.toThrow();
      });
    });

    it('should reject invalid recipient arrays', () => {
      const invalidRecipients = [
        [], // Empty array
        ['invalid-email'], // Invalid email
        Array(EMAIL_SECURITY_CONFIG.MAX_RECIPIENTS + 1).fill(
          'test@example.com'
        ), // Too many
      ];

      invalidRecipients.forEach(recipients => {
        expect(() => emailRecipientsSchema.parse(recipients)).toThrow();
      });
    });
  });
});

describe('Security Configuration', () => {
  it('should have reasonable limits', () => {
    expect(EMAIL_SECURITY_CONFIG.MAX_SUBJECT_LENGTH).toBeGreaterThan(50);
    expect(EMAIL_SECURITY_CONFIG.MAX_BODY_LENGTH).toBeGreaterThan(1000);
    expect(EMAIL_SECURITY_CONFIG.MAX_RECIPIENTS).toBeGreaterThan(1);
    expect(EMAIL_SECURITY_CONFIG.MAX_ATTACHMENT_SIZE).toBeGreaterThan(1024);
  });

  it('should have blocked domains configured', () => {
    expect(EMAIL_SECURITY_CONFIG.BLOCKED_DOMAINS).toContain('tempmail.org');
    expect(EMAIL_SECURITY_CONFIG.BLOCKED_DOMAINS).toContain('10minutemail.com');
  });

  it('should have security headers configured', () => {
    expect(EMAIL_SECURITY_CONFIG.REQUIRED_HEADERS).toContain('Message-ID');
    expect(EMAIL_SECURITY_CONFIG.REQUIRED_HEADERS).toContain('From');
    expect(EMAIL_SECURITY_CONFIG.FORBIDDEN_HEADERS).toContain('Bcc');
  });
});
