import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Detect if we are in a browser or server environment
const isBrowser = typeof window !== 'undefined';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(accessToken?: string) {
  // In Vite (client), we use import.meta.env
  // In Node (server), we use process.env
  const supabaseUrl = isBrowser 
    ? (import.meta.env.VITE_SUPABASE_URL || '') 
    : (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '');
    
  const supabaseKey = isBrowser
    ? (import.meta.env.VITE_SUPABASE_ANON_KEY || '')
    : (accessToken ? (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) : process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !supabaseKey) {
    const errorMsg = '⚠️ Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
    if (isBrowser) {
      console.error(errorMsg);
    } else {
      console.warn(errorMsg);
    }
    return null as any;
  }

  const options = accessToken ? {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  } : {};

  return createClient(supabaseUrl, supabaseKey || '', options);
}

// Singleton for client-side usage - lazy initialized
export const getClientSupabase = () => {
  if (!supabaseClient && isBrowser) {
    supabaseClient = getSupabase();
  }
  return supabaseClient;
};
