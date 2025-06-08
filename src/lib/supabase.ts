import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a lazy-loaded Supabase client to avoid build-time errors
let _supabase: ReturnType<typeof createClient> | null = null;

export const supabase = (() => {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase environment variables not configured. File storage features will be disabled.');
      // Return a mock client that throws helpful errors
      return {
        storage: {
          from: () => ({
            upload: () => Promise.reject(new Error('Supabase not configured')),
            download: () => Promise.reject(new Error('Supabase not configured')),
            remove: () => Promise.reject(new Error('Supabase not configured')),
          })
        }
      } as any;
    }
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
})();

// Server-side client with service role key for admin operations
export const createServerSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables not configured');
    return {
      storage: {
        from: () => ({
          upload: () => Promise.reject(new Error('Supabase not configured')),
          download: () => Promise.reject(new Error('Supabase not configured')),
          remove: () => Promise.reject(new Error('Supabase not configured')),
        })
      }
    } as any;
  }

  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not found, using anon key');
    return createClient(supabaseUrl, supabaseKey);
  }

  return createClient(supabaseUrl, serviceRoleKey);
};

export default supabase;
