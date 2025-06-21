/**
 * Supabase Server Client
 * Server-side Supabase client configuration
 */

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create a Supabase client for server-side operations with service role key
 * Use this for admin operations that bypass RLS
 */
export function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Create a Supabase client for server-side operations with user context
 * Use this for operations that should respect RLS
 */
export function createServerSupabaseClientWithAuth() {
  const cookieStore = cookies();
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'Cookie': cookieStore.toString()
      }
    }
  });
}

/**
 * Get the current user from server-side context
 */
export async function getServerUser() {
  const supabase = createServerSupabaseClientWithAuth();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting server user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error in getServerUser:', error);
    return null;
  }
}

/**
 * Check if user is authenticated on server-side
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getServerUser();
  return !!user;
}

/**
 * Get user session from server-side
 */
export async function getServerSession() {
  const supabase = createServerSupabaseClientWithAuth();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting server session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error in getServerSession:', error);
    return null;
  }
}

// Export the default service client
export const supabaseServer = createServerSupabaseClient();
