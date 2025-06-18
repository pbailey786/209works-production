/**
 * TypeScript module declarations for NextAuth v4 compatibility
 */

declare module 'next-auth/next' {
  export { getServerSession } from '@/lib/nextauth-compat'
  export type { Session } from 'next-auth'
}

declare module 'next-auth/middleware' {
  export { withAuth } from '@/lib/nextauth-compat'
}

// Extend the global NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: 'jobseeker' | 'employer' | 'admin'
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: 'jobseeker' | 'employer' | 'admin'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'jobseeker' | 'employer' | 'admin'
  }
}