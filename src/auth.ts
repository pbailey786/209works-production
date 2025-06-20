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
    strategy: 'jwt' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // NextAuth v5 requires explicit JWT configuration
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    // Ensure JWT secret is properly set
    secret: process.env.NEXTAUTH_SECRET,
  },

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Force new cookies on secret change
        maxAge: 7 * 24 * 60 * 60 // 7 days
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
    async jwt({ token, user, account }: any) {
      console.log('🔧 NextAuth v5 JWT callback triggered:', {
        hasToken: !!token,
        hasUser: !!user,
        hasAccount: !!account,
        tokenSub: token?.sub,
        userEmail: user?.email,
        accountProvider: account?.provider
      })

      // On initial sign in, user object will be available
      if (user) {
        console.log('🔧 Initial sign in - adding user data to token:', {
          id: user.id,
          email: user.email,
          role: user.role
        })

        // For NextAuth v5, ensure all required fields are set
        token.sub = user.id
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role || 'jobseeker'
        token.onboardingCompleted = user.onboardingCompleted || false
        token.twoFactorEnabled = user.twoFactorEnabled || false
        token.isEmailVerified = user.isEmailVerified || false

        // Add timestamp for debugging
        token.lastUpdated = Date.now()
      }

      // Ensure token always has required fields (for subsequent requests)
      if (!token.id && token.sub) {
        token.id = token.sub
      }

      console.log('🔧 JWT callback returning token:', {
        id: token.id,
        email: token.email,
        role: token.role,
        sub: token.sub,
        lastUpdated: token.lastUpdated
      })

      return token
    },

    async session({ session, token }: any) {
      console.log('🔧 NextAuth v5 Session callback triggered:', {
        hasSession: !!session,
        hasToken: !!token,
        tokenId: token?.id,
        tokenSub: token?.sub,
        tokenEmail: token?.email,
        tokenRole: token?.role,
        tokenLastUpdated: token?.lastUpdated
      })

      // Ensure session.user exists
      if (!session?.user) {
        console.error('❌ Session callback: session.user is missing')
        return session
      }

      // Ensure token exists and has required data
      if (!token || (!token.id && !token.sub)) {
        console.error('❌ Session callback: token is missing or invalid', { token })
        return session
      }

      // Populate session.user with data from JWT token
      session.user.id = token.id || token.sub
      session.user.email = token.email || session.user.email
      session.user.name = token.name || session.user.name
      session.user.role = token.role || 'jobseeker'
      session.user.onboardingCompleted = token.onboardingCompleted || false
      session.user.twoFactorEnabled = token.twoFactorEnabled || false
      session.user.isEmailVerified = token.isEmailVerified || false

      console.log('✅ Session populated successfully:', {
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: session.user.role,
        sessionExpires: session.expires,
        tokenLastUpdated: token.lastUpdated
      })

      return session
    },

    async signIn({ user, account }: any) {
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