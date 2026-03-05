import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    // Return a proxy or throw a descriptive error when used, 
    // but don't crash the entire server on boot.
    console.warn('⚠️ Supabase environment variables are missing. API calls will fail.');
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. Please configure them in the Secrets panel.');
  }

  supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  return supabaseClient;
}
