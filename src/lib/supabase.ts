import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serviceRoleClient: SupabaseClient | null = null;

export function getSupabase(accessToken?: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase environment variables are missing. API calls will fail.');
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. Please configure them in the Secrets panel.');
  }

  // If an access token is provided, create a client that respects RLS
  if (accessToken) {
    return createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }

  // Otherwise, return the service role client (bypasses RLS)
  if (!serviceRoleClient) {
    serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return serviceRoleClient;
}
