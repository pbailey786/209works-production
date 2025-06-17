import crypto from 'crypto';

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  saltLength: 32,
};

// Get encryption key from environment (must be 32 bytes for AES-256)
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  // If key is hex encoded, decode it
  if (key.length === 64 && /^[0-9a-f]+$/i.test(key)) {
    return Buffer.from(key, 'hex');
  }

  // Otherwise, derive key from the string using PBKDF2 with secure salt
  const salt = process.env.ENCRYPTION_SALT;
  if (!salt) {
    throw new Error(
      'ENCRYPTION_SALT environment variable is required for key derivation'
    );
  }

  // Use a minimum of 100,000 iterations for PBKDF2 (OWASP recommendation)
  return crypto.pbkdf2Sync(
    key,
    salt,
    100000,
    ENCRYPTION_CONFIG.keyLength,
    'sha256'
  );
}

// Generate a random encryption key (for initial setup)
export function generateEncryptionKey(): string {
  return crypto.randomBytes(ENCRYPTION_CONFIG.keyLength).toString('hex');
}

// Generate a random salt for key derivation
export function generateEncryptionSalt(): string {
  return crypto.randomBytes(ENCRYPTION_CONFIG.saltLength).toString('hex');
}

// Input validation helper
function validateInput(input: string, fieldName: string): void {
  if (typeof input !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (input.length > 1000000) {
    // 1MB limit
    throw new Error(`${fieldName} exceeds maximum length`);
  }
}

// Encrypt sensitive data using AES-256-GCM
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;

  validateInput(plaintext, 'Plaintext');

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);

    // Use secure AES-256-GCM encryption
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    // Set additional authenticated data
    const aad = Buffer.from('209jobs-encryption-v2', 'utf8');
    cipher.setAAD(aad);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex'),
    ]);

    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt sensitive data using AES-256-GCM
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return encryptedData;

  validateInput(encryptedData, 'Encrypted data');

  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');

    // Validate minimum length
    const minLength = ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength;
    if (combined.length < minLength) {
      throw new Error('Invalid encrypted data format');
    }

    // Extract components
    const iv = combined.subarray(0, ENCRYPTION_CONFIG.ivLength);
    const authTag = combined.subarray(
      ENCRYPTION_CONFIG.ivLength,
      ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength
    );
    const encrypted = combined.subarray(
      ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength
    );

    // Use secure AES-256-GCM decryption
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

    // Set additional authenticated data and auth tag
    const aad = Buffer.from('209jobs-encryption-v2', 'utf8');
    decipher.setAAD(aad);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Hash sensitive data for searching (one-way hash) with secure salt
export function hashForSearch(data: string): string {
  if (!data) return data;

  validateInput(data, 'Search data');

  const salt = process.env.SEARCH_HASH_SALT;
  if (!salt) {
    throw new Error('SEARCH_HASH_SALT environment variable is required');
  }

  // Use HMAC for better security than simple concatenation
  return crypto.createHmac('sha256', salt).update(data).digest('hex');
}

// Encrypt email addresses (common use case)
export function encryptEmail(email: string): string {
  if (!email) return email;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  return encrypt(email.toLowerCase().trim());
}

// Decrypt email addresses
export function decryptEmail(encryptedEmail: string): string {
  return decrypt(encryptedEmail);
}

// Encrypt phone numbers
export function encryptPhone(phone: string): string {
  if (!phone) return phone;

  // Normalize phone number before encryption
  const normalized = phone.replace(/\D/g, '');

  // Validate phone number length (basic validation)
  if (normalized.length < 10 || normalized.length > 15) {
    throw new Error('Invalid phone number format');
  }

  return encrypt(normalized);
}

// Decrypt phone numbers
export function decryptPhone(encryptedPhone: string): string {
  return decrypt(encryptedPhone);
}

// Encrypt Social Security Numbers (if applicable)
export function encryptSSN(ssn: string): string {
  if (!ssn) return ssn;

  // Remove any formatting
  const normalized = ssn.replace(/\D/g, '');

  // Validate SSN format (9 digits)
  if (normalized.length !== 9) {
    throw new Error('Invalid SSN format');
  }

  return encrypt(normalized);
}

// Decrypt Social Security Numbers
export function decryptSSN(encryptedSSN: string): string {
  return decrypt(encryptedSSN);
}

// Secure data types for commonly encrypted fields
export interface EncryptedField {
  encrypted: string;
  searchHash?: string; // For encrypted fields that need to be searchable
}

// Create encrypted field with search capability
export function createEncryptedField(
  plaintext: string,
  searchable: boolean = false
): EncryptedField {
  if (!plaintext) {
    throw new Error('Plaintext is required for encrypted field');
  }

  const result: EncryptedField = {
    encrypted: encrypt(plaintext),
  };

  if (searchable) {
    result.searchHash = hashForSearch(plaintext);
  }

  return result;
}

// Utility functions for database operations
export const EncryptionUtils = {
  // Encrypt user PII before saving to database
  encryptUserPII: (userData: any) => {
    if (!userData || typeof userData !== 'object') {
      throw new Error('Invalid user data for encryption');
    }

    const encrypted = { ...userData };

    if (encrypted.email) {
      encrypted.email = encryptEmail(encrypted.email);
    }

    if (encrypted.phone) {
      encrypted.phone = encryptPhone(encrypted.phone);
    }

    if (encrypted.address) {
      encrypted.address = encrypt(encrypted.address);
    }

    if (encrypted.dateOfBirth) {
      encrypted.dateOfBirth = encrypt(encrypted.dateOfBirth.toString());
    }

    return encrypted;
  },

  // Decrypt user PII after retrieving from database
  decryptUserPII: (encryptedData: any) => {
    if (!encryptedData || typeof encryptedData !== 'object') {
      throw new Error('Invalid encrypted data for decryption');
    }

    const decrypted = { ...encryptedData };

    try {
      if (decrypted.email) {
        decrypted.email = decryptEmail(decrypted.email);
      }

      if (decrypted.phone) {
        decrypted.phone = decryptPhone(decrypted.phone);
      }

      if (decrypted.address) {
        decrypted.address = decrypt(decrypted.address);
      }

      if (decrypted.dateOfBirth) {
        decrypted.dateOfBirth = decrypt(decrypted.dateOfBirth);
      }
    } catch (error) {
      console.error('Error decrypting user PII:', error);
      throw new Error('Failed to decrypt user data');
    }

    return decrypted;
  },

  // Encrypt job application sensitive data
  encryptApplicationData: (applicationData: any) => {
    if (!applicationData || typeof applicationData !== 'object') {
      throw new Error('Invalid application data for encryption');
    }

    const encrypted = { ...applicationData };

    if (encrypted.coverLetter) {
      encrypted.coverLetter = encrypt(encrypted.coverLetter);
    }

    if (encrypted.resumeText) {
      encrypted.resumeText = encrypt(encrypted.resumeText);
    }

    if (encrypted.salary) {
      encrypted.salary = encrypt(encrypted.salary.toString());
    }

    return encrypted;
  },

  // Decrypt job application sensitive data
  decryptApplicationData: (encryptedData: any) => {
    if (!encryptedData || typeof encryptedData !== 'object') {
      throw new Error('Invalid encrypted data for decryption');
    }

    const decrypted = { ...encryptedData };

    try {
      if (decrypted.coverLetter) {
        decrypted.coverLetter = decrypt(decrypted.coverLetter);
      }

      if (decrypted.resumeText) {
        decrypted.resumeText = decrypt(decrypted.resumeText);
      }

      if (decrypted.salary) {
        decrypted.salary = decrypt(decrypted.salary);
      }
    } catch (error) {
      console.error('Error decrypting application data:', error);
      throw new Error('Failed to decrypt application data');
    }

    return decrypted;
  },
};

// Environment validation
export function validateEncryptionEnvironment(): void {
  const errors: string[] = [];

  if (!process.env.ENCRYPTION_KEY) {
    errors.push('ENCRYPTION_KEY environment variable is required');
  }

  if (!process.env.ENCRYPTION_SALT) {
    errors.push(
      'ENCRYPTION_SALT environment variable is required (use generateEncryptionSalt() to create one)'
    );
  }

  if (!process.env.SEARCH_HASH_SALT) {
    errors.push(
      'SEARCH_HASH_SALT environment variable is required (use generateEncryptionSalt() to create one)'
    );
  }

  // Validate key strength
  if (process.env.ENCRYPTION_KEY) {
    const key = process.env.ENCRYPTION_KEY;
    if (key.length < 32) {
      errors.push('ENCRYPTION_KEY must be at least 32 characters long');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Encryption configuration errors:\n${errors.join('\n')}`);
  }
}

// Key rotation utilities (for future implementation)
export const KeyRotation = {
  // Rotate encryption key (would require re-encrypting all data)
  rotateKey: async (oldKey: string, newKey: string) => {
    // This would be a complex operation requiring:
    // 1. Decrypt all data with old key
    // 2. Re-encrypt with new key
    // 3. Update key in environment
    // Implementation depends on specific database and deployment setup
    throw new Error(
      'Key rotation not yet implemented - contact system administrator'
    );
  },

  // Check if key rotation is needed (implement based on security policy)
  checkKeyAge: () => {
    // Implementation would check when key was last rotated
    // and return whether rotation is needed
    return false;
  },

  // Generate new encryption keys for rotation
  generateRotationKeys: () => {
    return {
      encryptionKey: generateEncryptionKey(),
      encryptionSalt: generateEncryptionSalt(),
      searchHashSalt: generateEncryptionSalt(),
    };
  },
};
