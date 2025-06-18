/**
 * Compatibility layer for NextAuth v4 getServerSession in v5
 * This allows existing code to work while we gradually migrate
 */
import { auth } from '@/auth'

// Re-export the v5 auth function as getServerSession for compatibility
export const getServerSession = auth

// Also export as default
export default auth

// Type compatibility
export type { Session } from 'next-auth'