import NextAuth from 'next-auth'
import { JWT } from 'next-auth/jwt'

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