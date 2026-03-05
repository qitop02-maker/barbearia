import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Detect if we are in a browser or server environment
const isBrowser = typeof window !== 'undefined';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(accessToken?: string) {
  const supabaseUrl = isBrowser 
    ? (import.meta.env.VITE_SUPABASE_URL || '') 
    : (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '');
    
  const supabaseKey = isBrowser
    ? (import.meta.env.VITE_SUPABASE_ANON_KEY || '')
    : (accessToken ? (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) : '');

  if (!supabaseUrl || (!supabaseKey && isBrowser)) {
    const errorMsg = '⚠️ Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
    if (isBrowser) console.error(errorMsg);
    return null as any;
  }

  const options = accessToken ? {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  } : {};

  return createClient(supabaseUrl, supabaseKey || (process.env.SUPABASE_ANON_KEY || ''), options);
}

/**
 * Returns a Supabase client with service_role privileges.
 * ONLY use this on the server for administrative tasks that bypass RLS.
 */
export function getAdminSupabase() {
  if (isBrowser) {
    throw new Error('getAdminSupabase cannot be called from the browser');
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceKey) {
    console.error('⚠️ Admin Supabase credentials missing (SUPABASE_SERVICE_ROLE_KEY)');
    return null as any;
  }

  return createClient(supabaseUrl, serviceKey);
}

// Singleton for client-side usage - lazy initialized
export const getClientSupabase = () => {
  if (!supabaseClient && isBrowser) {
    supabaseClient = getSupabase();
  }
  return supabaseClient;
};
