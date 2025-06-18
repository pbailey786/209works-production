/**
 * Universal NextAuth v4 to v5 compatibility layer
 * This file provides all the necessary exports that v4 code expects
 */

import { auth } from '@/auth'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

// Main compatibility export - replaces getServerSession
export const getServerSession = auth

// Default export for different import patterns
export default {
  getServerSession: auth,
}

// Re-export types for compatibility
export type { Session, JWT }

// Note: signIn, signOut are client-side only - don't export from server compatibility layer

// Session-related utilities
export async function getCurrentSession() {
  return await auth()
}

export async function requireSession() {
  const session = await auth()
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
}

// Legacy middleware support (stub for now)
export const withAuth = (middleware: any, config?: any) => {
  console.warn('withAuth is deprecated in NextAuth v5. Use the new middleware pattern.')
  return middleware
}