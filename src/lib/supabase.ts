import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Detect if we are in a browser or server environment
const isBrowser = typeof window !== 'undefined';

let supabaseClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  const url = import.meta.env?.VITE_SUPABASE_URL || (isBrowser && (window as any).process?.env?.VITE_SUPABASE_URL);
  const key = import.meta.env?.VITE_SUPABASE_ANON_KEY || (isBrowser && (window as any).process?.env?.VITE_SUPABASE_ANON_KEY);
  
  const isConfigured = Boolean(url && key);
  
  if (!isConfigured && isBrowser) {
    console.warn('Supabase configuration check:', {
      hasUrl: !!url,
      hasKey: !!key,
      urlValue: url ? 'Present' : 'Missing',
      keyValue: key ? 'Present' : 'Missing'
    });
  }
  
  return isConfigured;
}

export function getSupabase(accessToken?: string) {
  // Try to get from Vite's import.meta.env or fallback to process.env (for server-side or shimmed environments)
  const supabaseUrl = 
    import.meta.env?.VITE_SUPABASE_URL || 
    process.env?.VITE_SUPABASE_URL || 
    process.env?.SUPABASE_URL || 
    '';
    
  const supabaseKey = 
    import.meta.env?.VITE_SUPABASE_ANON_KEY || 
    process.env?.VITE_SUPABASE_ANON_KEY || 
    process.env?.SUPABASE_ANON_KEY || 
    '';

  if (!supabaseUrl || !supabaseKey) {
    const errorMsg = '⚠️ Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
    console.error(errorMsg, { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey });
    return null as any;
  }

  const options = accessToken ? {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  } : {};

  return createClient(supabaseUrl, supabaseKey, options);
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
