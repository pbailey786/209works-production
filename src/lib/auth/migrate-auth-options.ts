/**
 * Migration utility to update the existing authOptions.ts with security enhancements
 * This preserves the existing functionality while adding security features
 */

import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/database/prisma';
import { compare } from 'bcryptjs';
import * as speakeasy from 'speakeasy';
// @ts-ignore - NextAuth v4 type import issues
import type { NextAuthOptions, Session } from 'next-auth';
// @ts-ignore - NextAuth v4 JWT type import issues
import type { JWT } from 'next-auth/jwt';
// @ts-ignore - NextAuth v4 SessionStrategy type import issues
import type { SessionStrategy } from 'next-auth';
import { normalizeEmail } from '@/lib/utils/email-utils';
import SecurityUtils, { SecurityEvent } from '@/lib/auth/security-utils';

// Enhanced authentication options with security improvements
const enhancedAuthOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt' as SessionStrategy,
    maxAge: 4 * 60 * 60, // 4 hours (reduced from 30 days)
    updateAge: 60 * 60, // 1 hour (reduced from 24 hours)
  },

  // Enhanced cookie security
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

  // Override any environment URL configuration for development
  ...(process.env.NODE_ENV === 'development' && {
    url: 'http://localhost:3001',
  }),

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
        console.log('🔐 Enhanced auth flow initiated');

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null;
        }

        if (!process.env.DATABASE_URL) {
          console.log('❌ No database connection');
          return null;
        }

        try {
          const normalizedEmail = normalizeEmail(credentials.email);
          
          // Find user with all security fields
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
              sessionVersion: true,
            }
          });

          if (!user || !user.passwordHash) {
            console.log('❌ User not found');
            // Log failed attempt for non-existent user
            await SecurityUtils.logSecurityEvent(
              'unknown',
              SecurityEvent.LOGIN_FAILED,
              { email: normalizedEmail, reason: 'user_not_found' }
            );
            return null;
          }

          // Check account lockout
          const lockoutCheck = await SecurityUtils.checkAccountLockout(user.id);
          if (lockoutCheck.isLocked) {
            console.log('❌ Account locked');
            await SecurityUtils.logSecurityEvent(
              user.id,
              SecurityEvent.LOGIN_FAILED,
              { reason: 'account_locked', lockoutExpires: lockoutCheck.lockoutExpires }
            );
            return null;
          }

          // Verify password
          const isValidPassword = await compare(credentials.password, user.passwordHash);
          if (!isValidPassword) {
            console.log('❌ Invalid password');
            
            // Increment failed attempts
            await SecurityUtils.incrementFailedAttempts(user.id);
            await SecurityUtils.logSecurityEvent(
              user.id,
              SecurityEvent.LOGIN_FAILED,
              { reason: 'invalid_password' }
            );
            return null;
          }

          // Check email verification
          if (!user.isEmailVerified) {
            console.log('❌ Email not verified');
            await SecurityUtils.logSecurityEvent(
              user.id,
              SecurityEvent.LOGIN_FAILED,
              { reason: 'email_not_verified' }
            );
            return null;
          }

          // Check 2FA if enabled
          if (user.twoFactorEnabled && user.twoFactorSecret) {
            if (!credentials.totp) {
              console.log('🔐 2FA required');
              // Don't log as failed - this is expected flow
              // Frontend should handle this by prompting for 2FA
              throw new Error('2FA_REQUIRED');
            }

            // Verify TOTP
            const isValidTotp = speakeasy.totp.verify({
              secret: user.twoFactorSecret,
              encoding: 'base32',
              token: credentials.totp,
              window: 2
            });

            if (!isValidTotp) {
              console.log('❌ Invalid 2FA code');
              await SecurityUtils.incrementFailedAttempts(user.id);
              await SecurityUtils.logSecurityEvent(
                user.id,
                SecurityEvent.TWO_FACTOR_FAILED,
                { reason: 'invalid_totp' }
              );
              return null;
            }

            // Log successful 2FA
            await SecurityUtils.logSecurityEvent(
              user.id,
              SecurityEvent.TWO_FACTOR_SUCCESS,
              {}
            );
          }

          // Success - reset failed attempts and log
          await SecurityUtils.resetFailedAttempts(user.id);
          await SecurityUtils.logSecurityEvent(
            user.id,
            SecurityEvent.LOGIN_SUCCESS,
            { 
              twoFactorUsed: user.twoFactorEnabled,
              sessionVersion: user.sessionVersion 
            }
          );

          console.log('✅ Authentication successful');
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };

        } catch (error) {
          console.error('💥 Auth error:', error);
          
          // Handle specific 2FA required error
          if (error instanceof Error && error.message === '2FA_REQUIRED') {
            throw error;
          }
          
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.onboardingCompleted = (user as any).onboardingCompleted;
        
        // Add session version for security
        const userRecord = await prisma.user.findUnique({
          where: { id: user.id },
          select: { sessionVersion: true }
        });
        token.sessionVersion = userRecord?.sessionVersion || 0;
      }

      // Handle session updates
      if (trigger === "update") {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            onboardingCompleted: true,
            sessionVersion: true,
          }
        });

        if (currentUser) {
          token.role = currentUser.role;
          token.onboardingCompleted = currentUser.onboardingCompleted;
          token.sessionVersion = currentUser.sessionVersion;
        }
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: any }) {
      if (token && session.user) {
        // Verify session is still valid by checking session version
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
            sessionVersion: true,
          }
        });

        if (!user) {
          // User deleted
          return null as any;
        }

        // Check if session version matches (for forced logout)
        if (user.sessionVersion !== token.sessionVersion) {
          console.log('🔄 Session invalidated due to version mismatch');
          return null as any;
        }

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

      return session;
    },

    async redirect({ url, baseUrl }) {
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
    async signIn({ user, account, isNewUser }) {
      if (user?.id) {
        await SecurityUtils.logSecurityEvent(
          user.id,
          SecurityEvent.LOGIN_SUCCESS,
          {
            provider: account?.provider || 'credentials',
            isNewUser: isNewUser || false
          }
        );
      }
    },

    async signOut({ token }) {
      if (token?.id) {
        await SecurityUtils.logSecurityEvent(
          token.id as string,
          SecurityEvent.LOGOUT,
          {}
        );
      }
    }
  }
};

export default enhancedAuthOptions;