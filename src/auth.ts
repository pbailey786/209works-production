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
    async jwt({ token, user, account }: any) {
      console.log('🔧 NextAuth v5 JWT callback:', { 
        hasToken: !!token, 
        hasUser: !!user, 
        hasAccount: !!account 
      })

      if (user) {
        console.log('🔧 Adding user data to token:', { 
          id: user.id, 
          role: (user as any).role 
        })
        token.role = (user as any).role || 'jobseeker'
        token.id = user.id
      }

      return token
    },

    async session({ session, token }: any) {
      console.log('🔧 NextAuth v5 Session callback:', { 
        hasSession: !!session, 
        hasToken: !!token 
      })

      if (token && session.user) {
        console.log('🔧 Adding token data to session:', { 
          id: token.id, 
          role: token.role 
        })
        session.user.id = token.id as string
        ;(session.user as any).role = token.role || 'jobseeker'
      }

      console.log('🔧 Final session:', {
        id: session.user?.id,
        email: session.user?.email,
        role: (session.user as any)?.role
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

// Create the NextAuth instance
const nextAuthInstance = NextAuth(authConfig as any)

// Export the destructured components
export const handlers = nextAuthInstance.handlers
export const auth = nextAuthInstance.auth  
export const signIn = nextAuthInstance.signIn
export const signOut = nextAuthInstance.signOut