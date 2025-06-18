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
// Import compatibility fix
import '@/lib/auth/compatibility-fix';

console.log('🔧 AuthOptions loading...');
console.log('🔑 Environment check:');
console.log('  - NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
console.log('  - NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('  - DATABASE_URL exists:', !!process.env.DATABASE_URL);

console.log('🔧 Creating CredentialsProvider...');

const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt' as SessionStrategy,
    maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30)
    updateAge: 4 * 60 * 60, // 4 hours (reduced from 24 hours)
  },
  // Use dynamic URL for development to handle different ports
  ...(process.env.NODE_ENV === 'development' && {
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
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
  // Callbacks are essential for proper session handling
  callbacks: {
    async jwt({ token, user, account, profile }: any) {
      console.log('🎟️ JWT callback triggered');
      console.log('  - User exists:', !!user);
      console.log('  - Token sub:', token.sub);
      console.log('  - Account provider:', account?.provider);

      // On sign in, user object will be available
      if (user) {
        console.log('🎟️ Adding user data to token');
        token.id = user.id;
        token.role = user.role || 'job_seeker';
        token.email = user.email;
        token.name = user.name;
      }

      // For OAuth providers, ensure user data is properly set
      if (account?.provider === 'google' && user?.email) {
        console.log('🎟️ Handling Google OAuth user');
        try {
          const { prisma } = await import('@/lib/database/prisma');
          const dbUser = await prisma.user.findUnique({
            where: { email: normalizeEmail(user.email) },
            select: { id: true, role: true, name: true },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error('💥 Error in JWT callback:', error);
        }
      }

      console.log('🎟️ Token prepared with ID:', token.id);
      return token;
    },

    async session({ session, token }: { session: Session; token: any }) {
      console.log('📋 Session callback triggered');
      console.log('  - Token ID:', token.id);
      console.log('  - Token email:', token.email);
      console.log('  - Session user email:', session.user?.email);

      if (session.user && token) {
        // Ensure user ID is properly set
        const userId = token.id || token.sub;
        
        session.user.id = userId as string;
        session.user.role = token.role as string || 'job_seeker';
        session.user.email = token.email as string || session.user.email;
        session.user.name = token.name as string || session.user.name;

        console.log('📋 Session user prepared:', {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        });
      }

      return session;
    },

    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      console.log('🔄 Redirect callback:', { url, baseUrl });
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Handle same origin URLs
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      return baseUrl;
    },
  },

  // Add events for better debugging
  events: {
    async signIn({ user, account, profile, isNewUser }: any) {
      console.log('🎉 Sign in event:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
      });
    },
    
    async session({ session, token }: any) {
      console.log('📱 Session event:', {
        userId: session?.user?.id,
        email: session?.user?.email,
      });
    },
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
};

export default authOptions;
