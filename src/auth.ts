import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/database/prisma'
import { compare } from 'bcryptjs'
import { normalizeEmail } from '@/lib/utils/email-utils'

console.log('🔧 Auth.js v5 configuration loading...')

const authConfig = {
  adapter: PrismaAdapter(prisma),
  
  session: {
    strategy: 'database' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials: Record<string, any>) {
        console.log('🔐 NextAuth v5 credential authorization starting...')
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing email or password')
          return null
        }

        try {
          // Test mode for debugging
          if (credentials.email === 'test@test.com' && credentials.password === 'test123') {
            console.log('✅ Test user authenticated successfully')
            return {
              id: 'test-user-id',
              email: 'test@test.com',
              name: 'Test User',
              role: 'jobseeker',
              onboardingCompleted: false,
              twoFactorEnabled: false,
              isEmailVerified: true
            }
          }

          // Production authentication logic
          const normalizedEmail = normalizeEmail(credentials.email as string)
          console.log('🔍 Looking for user:', normalizedEmail)

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
          })

          if (!user) {
            console.log('❌ User not found')
            return null
          }

          const isPasswordValid = await compare(credentials.password as string, user.passwordHash || '')
          
          if (!isPasswordValid) {
            console.log('❌ Invalid password')
            return null
          }

          console.log('✅ User authenticated successfully:', { 
            id: user.id, 
            email: user.email, 
            role: user.role 
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            role: user.role || 'jobseeker',
            onboardingCompleted: user.onboardingCompleted || false,
            twoFactorEnabled: user.twoFactorEnabled || false,
            isEmailVerified: user.isEmailVerified || false
          }
        } catch (error) {
          console.error('❌ Auth error:', error)
          return null
        }
      }
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],

  callbacks: {
    async jwt({ token, user, account, profile }: any) {
      console.log('🔧 NextAuth v5 JWT callback triggered:', {
        hasToken: !!token,
        hasUser: !!user,
        hasAccount: !!account,
        tokenSub: token?.sub,
        userEmail: user?.email
      })

      // On initial sign in, user object will be available
      if (user) {
        console.log('🔧 Initial sign in - adding user data to token:', {
          id: user.id,
          email: user.email,
          role: user.role
        })
        token.id = user.id
        token.role = user.role || 'jobseeker'
        token.email = user.email
        token.name = user.name
        token.onboardingCompleted = (user as any).onboardingCompleted || false
        token.twoFactorEnabled = (user as any).twoFactorEnabled || false
        token.isEmailVerified = (user as any).isEmailVerified || false
      }

      // If we don't have user ID but have email, fetch from database
      if (!token.id && token.email) {
        try {
          console.log('🔧 Fetching user ID from database for email:', token.email)
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              onboardingCompleted: true,
              twoFactorEnabled: true,
              isEmailVerified: true,
            }
          })

          if (dbUser) {
            console.log('🔧 Found user in database, updating token:', { id: dbUser.id, role: dbUser.role })
            token.id = dbUser.id
            token.role = dbUser.role
            token.name = dbUser.name
            token.onboardingCompleted = dbUser.onboardingCompleted
            token.twoFactorEnabled = dbUser.twoFactorEnabled
            token.isEmailVerified = dbUser.isEmailVerified
          }
        } catch (error) {
          console.error('❌ Failed to fetch user data in JWT callback:', error)
        }
      }

      console.log('🔧 JWT callback returning token:', {
        id: token.id,
        email: token.email,
        role: token.role,
        sub: token.sub
      })

      return token
    },

    async session({ session, user }: any) {
      console.log('🔧 NextAuth v5 Database Session callback triggered:', {
        hasSession: !!session,
        hasUser: !!user,
        hasSessionUser: !!session?.user,
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role
      })

      // With database strategy, user comes from database directly
      if (!session) {
        console.warn('🔧 Session callback: No session object provided')
        return { user: {}, expires: '' }
      }

      if (user) {
        // User data comes from database with database strategy
        console.log('🔧 Adding database user data to session...')

        const enhancedSession = {
          ...session,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'jobseeker',
            onboardingCompleted: user.onboardingCompleted || false,
            twoFactorEnabled: user.twoFactorEnabled || false,
            isEmailVerified: user.isEmailVerified || false
          }
        }

        console.log('🔧 Enhanced database session created:', {
          user: {
            id: enhancedSession.user.id,
            email: enhancedSession.user.email,
            name: enhancedSession.user.name,
            role: enhancedSession.user.role,
            onboardingCompleted: enhancedSession.user.onboardingCompleted
          }
        })

        return enhancedSession
      } else {
        console.warn('🔧 Session callback: No user data provided')
        return session
      }
    },

    async signIn({ user, account, profile }: any) {
      console.log('🔧 NextAuth v5 SignIn callback:', { 
        provider: account?.provider,
        userEmail: user?.email 
      })

      if (account?.provider === 'google') {
        try {
          const normalizedEmail = normalizeEmail(user.email as string)
          
          let dbUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
          })

          if (!dbUser) {
            console.log('🔧 Creating new Google user:', normalizedEmail)
            dbUser = await prisma.user.create({
              data: {
                email: normalizedEmail,
                name: user.name || user.email,
                passwordHash: '', // OAuth users don't have passwords
                role: 'jobseeker',
                isEmailVerified: true // Google users are pre-verified
              }
            })
          }

          user.id = dbUser.id
          user.role = dbUser.role
          
          console.log('✅ Google sign-in successful:', { 
            id: dbUser.id, 
            email: dbUser.email, 
            role: dbUser.role 
          })
        } catch (error) {
          console.error('❌ Google sign-in error:', error)
          return false
        }
      }

      return true
    }
  },

  pages: {
    signIn: '/signin',
    error: '/auth/error',
  },
  
  debug: process.env.NODE_ENV === 'development',

  trustHost: true, // Important for production

  // NextAuth v5 beta specific configuration
  secret: process.env.NEXTAUTH_SECRET,

  // Ensure proper URL configuration
  basePath: '/api/auth',
}

// NextAuth v5 beta - use type assertion to handle callable issue
const authInstance = (NextAuth as any)(authConfig)

export const handlers = authInstance.handlers
export const auth = authInstance.auth
export const signIn = authInstance.signIn
export const signOut = authInstance.signOut

// Export the configuration for compatibility
export { authConfig }