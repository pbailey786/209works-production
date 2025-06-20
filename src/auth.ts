import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/database/prisma'
import { compare } from 'bcryptjs'
import { normalizeEmail } from '@/lib/utils/email-utils'
// Type imports for NextAuth v5

console.log('🔧 Auth.js v5 configuration loading...')

const authConfig = {
  adapter: PrismaAdapter(prisma),
  
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
              role: 'jobseeker'
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
            role: user.role || 'jobseeker'
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
      }

      console.log('🔧 JWT callback returning token:', {
        id: token.id,
        email: token.email,
        role: token.role,
        sub: token.sub
      })

      return token
    },

    async session({ session, token, trigger, newSession }: any) {
      console.log('🔧 NextAuth v5 Session callback triggered:', { 
        hasSession: !!session, 
        hasToken: !!token,
        hasSessionUser: !!session?.user,
        tokenId: token?.id,
        tokenEmail: token?.email,
        tokenRole: token?.role,
        trigger,
        newSession
      })

      if (token && session?.user) {
        console.log('🔧 Adding token data to session user...')
        
        // Ensure user object has all required fields
        session.user.id = token.id as string || token.sub as string
        session.user.email = token.email as string || session.user.email
        ;(session.user as any).role = token.role || 'jobseeker'

        // If this is an update trigger, fetch fresh user data from database
        if (trigger === 'update' && session.user.id) {
          try {
            console.log('🔧 Session update triggered, fetching fresh user data...')
            const dbUser = await prisma.user.findUnique({
              where: { id: session.user.id },
              select: { id: true, email: true, name: true, role: true, isEmailVerified: true }
            })
            
            if (dbUser) {
              session.user.id = dbUser.id
              session.user.email = dbUser.email
              session.user.name = dbUser.name
              ;(session.user as any).role = dbUser.role
              ;(session.user as any).isEmailVerified = dbUser.isEmailVerified
              
              console.log('✅ Session updated with fresh database data:', {
                id: dbUser.id,
                email: dbUser.email,
                role: dbUser.role
              })
            }
          } catch (error) {
            console.error('❌ Failed to fetch fresh user data:', error)
          }
        }

        console.log('🔧 Session user updated:', {
          id: session.user.id,
          email: session.user.email,
          role: (session.user as any).role
        })
      } else {
        console.warn('🔧 Session callback: Missing token or session.user')
      }

      console.log('🔧 Final session being returned:', {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          role: (session.user as any)?.role
        }
      })

      return session
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
}

// For NextAuth v5, use the correct destructuring approach
export const {
  handlers,
  auth,
  signIn,
  signOut
} = NextAuth(authConfig)

// Export the configuration for compatibility
export { authConfig }