/**
 * Compatibility shim for 'next-auth/next' imports in v5
 * This file provides backward compatibility for existing code
 */

// Import the v5 auth function
import { auth } from './auth'

// Export as getServerSession for v4 compatibility
export const getServerSession = auth

// Re-export other common imports that might be needed
export type { Session } from 'next-auth'
export type { JWT } from 'next-auth/jwt'

// Default export
export default { getServerSession }