import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/database/prisma';
import { compare } from 'bcryptjs';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import * as speakeasy from 'speakeasy';
import crypto from 'crypto';
// @ts-ignore - NextAuth v4 type import issues
import type { NextAuthOptions, Session } from 'next-auth';
// @ts-ignore - NextAuth v4 JWT type import issues
import type { JWT } from 'next-auth/jwt';
// @ts-ignore - NextAuth v4 SessionStrategy type import issues
import type { SessionStrategy } from 'next-auth';
import { normalizeEmail } from '@/lib/utils/email-utils';

// Security constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_MAX_AGE = 4 * 60 * 60; // 4 hours
const SESSION_UPDATE_AGE = 60 * 60; // 1 hour
const BCRYPT_ROUNDS = 12; // Increased from 10

// Custom error codes for client handling
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  INVALID_TWO_FACTOR = 'INVALID_TWO_FACTOR',
  SERVER_ERROR = 'SERVER_ERROR',
}

// Helper function to check if account is locked
async function isAccountLocked(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true }
  });
  
  if (!user?.lockedUntil) return false;
  
  if (new Date() < user.lockedUntil) {
    return true;
  }
  
  // Unlock if time has passed
  await prisma.user.update({
    where: { id: userId },
    data: { 
      lockedUntil: null,
      failedLoginAttempts: 0
    }
  });
  
  return false;
}

// Helper function to handle failed login attempts
async function handleFailedLogin(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, failedLoginAttempts: true }
  });
  
  if (!user) return;
  
  const newAttempts = (user.failedLoginAttempts || 0) + 1;
  
  const updateData: any = {
    failedLoginAttempts: newAttempts
  };
  
  // Lock account if max attempts reached
  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION);
    
    // Log security event
    await prisma.securityLog.create({
      data: {
        userId: user.id,
        event: 'ACCOUNT_LOCKED',
        ipAddress: '', // Should be passed from request
        userAgent: '', // Should be passed from request
        metadata: {
          attempts: newAttempts,
          lockedUntil: updateData.lockedUntil.toISOString()
        }
      }
    });
  }
  
  await prisma.user.update({
    where: { id: user.id },
    data: updateData
  });
}

// Helper function to reset failed login attempts
async function resetFailedLoginAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null
    }
  });
}

const secureAuthOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt' as SessionStrategy,
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  
  // Enhanced cookie security settings
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Host-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  
  // Enable CSRF protection
  useSecureCookies: process.env.NODE_ENV === 'production',
  
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totp: { label: '2FA Code', type: 'text', optional: true },
      },
      async authorize(credentials, req) {
        try {
          // Validate inputs
          if (!credentials?.email || !credentials?.password) {
            throw new Error(AuthErrorCode.INVALID_CREDENTIALS);
          }

          // Normalize email
          const normalizedEmail = normalizeEmail(credentials.email);
          
          // Find user with security fields
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              passwordHash: true,
              isEmailVerified: true,
              twoFactorEnabled: true,
              twoFactorSecret: true,
              failedLoginAttempts: true,
              lockedUntil: true,
            }
          });

          // Generic error message to prevent user enumeration
          if (!user || !user.passwordHash) {
            await handleFailedLogin(normalizedEmail);
            throw new Error(AuthErrorCode.INVALID_CREDENTIALS);
          }

          // Check if account is locked
          if (await isAccountLocked(user.id)) {
            throw new Error(AuthErrorCode.ACCOUNT_LOCKED);
          }

          // Verify password
          const isValidPassword = await compare(credentials.password, user.passwordHash);
          
          if (!isValidPassword) {
            await handleFailedLogin(user.email);
            throw new Error(AuthErrorCode.INVALID_CREDENTIALS);
          }

          // Check email verification
          if (!user.isEmailVerified) {
            throw new Error(AuthErrorCode.EMAIL_NOT_VERIFIED);
          }

          // Check 2FA if enabled
          if (user.twoFactorEnabled) {
            if (!credentials.totp) {
              // Return special error to trigger 2FA prompt
              throw new Error(AuthErrorCode.TWO_FACTOR_REQUIRED);
            }

            // Verify TOTP code
            const isValidTotp = speakeasy.totp.verify({
              secret: user.twoFactorSecret!,
              encoding: 'base32',
              token: credentials.totp,
              window: 2 // Allow 2 time steps for clock drift
            });

            if (!isValidTotp) {
              await handleFailedLogin(user.email);
              throw new Error(AuthErrorCode.INVALID_TWO_FACTOR);
            }
          }

          // Success - reset failed attempts
          await resetFailedLoginAttempts(user.id);

          // Log successful login
          await prisma.securityLog.create({
            data: {
              userId: user.id,
              event: 'LOGIN_SUCCESS',
              ipAddress: '', // Should be extracted from request
              userAgent: '', // Should be extracted from request
              metadata: {
                twoFactorUsed: user.twoFactorEnabled
              }
            }
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
          
        } catch (error) {
          // Log authentication errors
          console.error('Authentication error:', error);
          
          if (error instanceof Error && Object.values(AuthErrorCode).includes(error.message as AuthErrorCode)) {
            throw error;
          }
          
          throw new Error(AuthErrorCode.SERVER_ERROR);
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Additional security for OAuth
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  
  pages: {
    signIn: '/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
  
  callbacks: {
    async jwt({ token, user, account, trigger }: { token: any; user?: any; account?: any; trigger?: string }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.onboardingCompleted = (user as any).onboardingCompleted;
      }
      
      // Handle session updates
      if (trigger === "update") {
        // Refresh user data from database
        const currentUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            onboardingCompleted: true,
          }
        });
        
        if (currentUser) {
          token.role = currentUser.role;
          token.onboardingCompleted = currentUser.onboardingCompleted;
        }
      }
      
      return token;
    },
    
    async session({ session, token }: { session: Session; token: any }) {
      if (token && session.user) {
        // Fetch latest user data including security status
        const user = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            profilePictureUrl: true,
            onboardingCompleted: true,
            twoFactorEnabled: true,
            isEmailVerified: true,
          }
        });

        if (user) {
          session.user = {
            ...session.user,
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.profilePictureUrl,
            onboardingCompleted: user.onboardingCompleted,
            twoFactorEnabled: user.twoFactorEnabled,
            isEmailVerified: user.isEmailVerified,
          };
        }
      }
      
      return session;
    },
    
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Only allow redirects to our domain
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
  
  events: {
    async signIn({ user, account, isNewUser }: { user: any; account?: any; isNewUser?: boolean }) {
      // Log sign in event
      if (user?.id) {
        await prisma.securityLog.create({
          data: {
            userId: user.id,
            event: 'SIGN_IN',
            ipAddress: '', // Should be extracted from request
            userAgent: '', // Should be extracted from request
            metadata: {
              provider: account?.provider || 'credentials',
              isNewUser: isNewUser || false
            }
          }
        });
      }
    },
    
    async signOut({ token }: { token?: any }) {
      // Log sign out event
      if (token?.id) {
        await prisma.securityLog.create({
          data: {
            userId: token.id as string,
            event: 'SIGN_OUT',
            ipAddress: '', // Should be extracted from request
            userAgent: '', // Should be extracted from request
            metadata: {}
          }
        });
      }
    }
  }
};

export default secureAuthOptions;