import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/database/prisma';
import { compare } from 'bcryptjs';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
// @ts-ignore - NextAuth v4 type import issues
import type { NextAuthOptions, Session } from 'next-auth';
// @ts-ignore - NextAuth v4 JWT type import issues
import type { JWT } from 'next-auth/jwt';
import type { User } from '@prisma/client';
import speakeasy from 'speakeasy';
// @ts-ignore - NextAuth v4 SessionStrategy type import issues
import type { SessionStrategy } from 'next-auth';
import { normalizeEmail } from '@/lib/utils/email-utils';

console.log('🔧 AuthOptions loading...');
console.log('🔑 Environment check:');
console.log('  - NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
console.log('  - NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('  - DATABASE_URL exists:', !!process.env.DATABASE_URL);

console.log('🔧 Creating CredentialsProvider...');

const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt' as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 1 day
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
        totp: { label: 'TOTP Code', type: 'text' },
      },
      async authorize(credentials, req) {
        console.log('🚨🚨🚨 AUTHORIZE FUNCTION CALLED! 🚨🚨🚨');
        console.log('🔐 Raw credentials object:', credentials);
        console.log('🔐 Email:', credentials?.email);
        console.log('🔐 Password length:', credentials?.password?.length);

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ FAILED: Missing email or password');
          console.log('❌ Has email:', !!credentials?.email);
          console.log('❌ Has password:', !!credentials?.password);
          return null;
        }

        // Check if database is available
        if (!process.env.DATABASE_URL) {
          console.log('❌ FAILED: No DATABASE_URL configured');
          return null;
        }

        console.log('✅ Credentials validation passed, looking up user...');

        try {
          // Normalize email to lowercase for case-insensitive lookup
          const normalizedEmail = normalizeEmail(credentials.email);
          console.log('🔍 Querying database for user:', normalizedEmail);
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          console.log('👤 Database query result:');
          console.log('  - User found:', !!user);
          if (user) {
            console.log('  - User ID:', user.id);
            console.log('  - User email:', user.email);
            console.log('  - User name:', user.name);
            console.log('  - User role:', user.role);
            console.log('  - Has password hash:', !!user.passwordHash);
            console.log('  - Email verified:', user.isEmailVerified);
          }

          if (!user || !user.passwordHash) {
            console.log('❌ FAILED: No user found or no password hash');
            return null;
          }

          console.log('🔑 Comparing passwords...');
          console.log('🔑 Input password:', credentials.password);
          console.log('🔑 Stored hash length:', user.passwordHash.length);

          const isValid = await compare(
            credentials.password,
            user.passwordHash
          );
          console.log('🔑 Password comparison result:', isValid);

          if (!isValid) {
            console.log('❌ FAILED: Password does not match');
            return null;
          }

          if (!user.isEmailVerified) {
            console.log('❌ FAILED: Email not verified');
            return null;
          }

          console.log('✅✅✅ AUTH SUCCESSFUL! Returning user object...');
          const returnUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
          console.log('✅ Returning:', returnUser);
          return returnUser;
        } catch (error) {
          console.error('💥💥💥 DATABASE ERROR during auth:', error);
          console.error(
            '💥 Error message:',
            error instanceof Error ? error.message : 'Unknown error'
          );
          console.error(
            '💥 Error stack:',
            error instanceof Error ? error.stack : 'No stack trace'
          );
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // You can add more NextAuth configuration here (callbacks, pages, etc.)
  pages: {
    signIn: '/signin', // Default to job seeker sign-in page
  },
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }: any) {
      console.log(
        '🎟️ JWT callback - user:',
        !!user,
        'token.email:',
        token.email
      );
      if (user) {
        token.role = (user as any).role;
        token.onboardingCompleted = (user as any).onboardingCompleted;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: any }) {
      console.log(
        '📋 Session callback - token.email:',
        token.email,
        'token.role:',
        token.role,
        'token.sub:',
        token.sub
      );

      // Fetch latest user data to include profile picture
      if (token.sub && session.user?.email && process.env.DATABASE_URL) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              profilePictureUrl: true,
              name: true,
            },
          });

          if (user) {
            return {
              ...session,
              user: {
                ...session.user,
                id: token.sub,
                role: token.role,
                onboardingCompleted: token.onboardingCompleted,
                image: user.profilePictureUrl,
                name: user.name || session.user.name,
              },
            };
          }
        } catch (error) {
          console.error('Error fetching user data in session callback:', error);
          // Continue with basic session data if database fails
        }
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          role: token.role,
          onboardingCompleted: token.onboardingCompleted,
        },
      };
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // If user is signing in, check their role and redirect accordingly
      if (url.startsWith('/')) {
        // Handle relative URLs
        const fullUrl = new URL(url, baseUrl);
        return fullUrl.toString();
      }

      // For sign-in redirects, we'll handle this in the sign-in page
      // This callback is mainly for external URLs
      if (url.startsWith(baseUrl)) {
        return url;
      }

      return baseUrl;
    },
  },
};

export default authOptions;
