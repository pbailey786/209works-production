import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/database/prisma'
import { compare } from 'bcryptjs'
import { normalizeEmail } from '@/lib/utils/email-utils'
// Type imports for NextAuth v5

console.log('🔧 Auth.js v5 configuration loading...')

const config = {
  adapter: PrismaAdapter(prisma),
  
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🚨 AUTHORIZE v5 CALLED!', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        // Test mode for debugging
        if (credentials.email === 'test@test.com' && credentials.password === 'test123') {
          console.log('🧪 TEST MODE: Using test credentials')
          const testUser = {
            id: 'test-user-id',
            email: 'test@test.com',
            name: 'Test User',
            role: 'jobseeker',
          }
          console.log('✅ TEST USER RETURNED:', testUser)
          return testUser
        }

        try {
          const normalizedEmail = normalizeEmail(credentials.email as string)
          console.log('🔍 Querying database for user:', normalizedEmail)
          
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          })

          console.log('👤 Database query result:', {
            found: !!user,
            id: user?.id,
            email: user?.email,
            hasPassword: !!user?.passwordHash,
            verified: user?.isEmailVerified,
          })

          if (!user || !user.passwordHash) {
            console.log('❌ No user found or no password hash')
            return null
          }

          const isValid = await compare(credentials.password as string, user.passwordHash)
          console.log('🔑 Password valid:', isValid)

          if (!isValid) {
            console.log('❌ Invalid password')
            return null
          }

          if (!user.isEmailVerified) {
            console.log('❌ Email not verified')
            return null
          }

          console.log('✅ Auth successful, returning user')
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('💥 Database error:', error)
          return null
        }
      },
    }),
    
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  pages: {
    signIn: '/signin',
  },
  
  callbacks: {
    async jwt({ token, user, account }: any) {
      console.log('🎟️ JWT callback v5:', {
        hasUser: !!user,
        tokenId: token.sub,
        provider: account?.provider,
      })
      
      // On sign in, user object will be available
      if (user) {
        console.log('🎟️ Adding user data to token:', user)
        token.role = (user as any).role || 'jobseeker'
        token.id = user.id
      }
      
      // For OAuth providers, ensure user data from database
      if (account?.provider === 'google' && user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: normalizeEmail(user.email) },
            select: { id: true, role: true },
          })
          
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
          }
        } catch (error) {
          console.error('💥 Error in JWT callback:', error)
        }
      }
      
      console.log('🎟️ Token prepared:', {
        id: token.id,
        role: token.role,
        email: token.email,
      })
      
      return token
    },
    
    async session({ session, token }: any) {
      console.log('📋 Session callback v5:', {
        tokenId: token.id,
        tokenRole: token.role,
        sessionEmail: session.user?.email,
      })
      
      // Ensure session has user data from token
      if (token && session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role || 'jobseeker'
      }
      
      console.log('📋 Final session:', {
        userId: session.user?.id,
        userRole: (session.user as any)?.role,
        userEmail: session.user?.email,
      })
      
      return session
    },
    
    async redirect({ url, baseUrl }: any) {
      console.log('🔄 Redirect v5:', { url, baseUrl })
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      
      // Ensure same origin
      try {
        const urlObj = new URL(url, baseUrl)
        if (urlObj.origin === new URL(baseUrl).origin) {
          return urlObj.toString()
        }
      } catch (error) {
        console.error('🔄 Redirect error:', error)
      }
      
      return baseUrl
    },
  },
  
  events: {
    async signIn({ user, account, profile }: any) {
      console.log('🎉 Sign in event v5:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
      })
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
  
  trustHost: true, // Important for production
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)
export { config as authConfig }