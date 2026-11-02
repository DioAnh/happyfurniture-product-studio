import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (client) return client;
  const url = process.env.HAPPY_FURNITURE_SUPABASE_URL;
  const key = process.env.HAPPY_FURNITURE_SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Supabase server configuration is missing.');
  client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return client;
}
