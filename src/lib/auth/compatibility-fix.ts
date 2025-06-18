/**
 * NextAuth v4.24.11 + Next.js v15.3.2 Compatibility Fix
 * 
 * This file addresses known compatibility issues between NextAuth v4 and Next.js v15
 */

// Simple compatibility fixes without conflicting type declarations

/**
 * Fix for NextAuth session loading issues with Next.js 15
 */
export function fixNextAuthCompat() {
  // Ensure NextAuth environment variables are properly set
  if (typeof window === 'undefined') {
    // Server-side only
    process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Force NextAuth to use JWT strategy consistently
    if (!process.env.NEXTAUTH_SESSION_STRATEGY) {
      process.env.NEXTAUTH_SESSION_STRATEGY = 'jwt';
    }
  }
}

/**
 * Compatibility wrapper for getServerSession
 */
export async function getCompatibleServerSession() {
  try {
    const { getServerSession } = await import('next-auth/next');
    const authOptions = (await import('../../app/api/auth/authOptions')).default;
    
    return await getServerSession(authOptions);
  } catch (error) {
    console.error('🔧 Server session compatibility error:', error);
    return null;
  }
}

// Initialize compatibility fixes
fixNextAuthCompat();