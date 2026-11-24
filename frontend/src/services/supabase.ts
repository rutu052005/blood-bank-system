import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default keys from environment, with fallback to user's saved credentials in localStorage
const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('supabase_url') : null;
const savedKey = typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') : null;

export const defaultSupabaseUrl = savedUrl || import.meta.env.VITE_SUPABASE_URL || 'https://efhytlcbxjykpfabvdgg.supabase.co';
export const defaultSupabaseAnonKey = savedKey || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaHl0bGNieGp5a3BmYWJ2ZGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDM0MDIsImV4cCI6MjEwNzIxOTQwMn0.2YDeqBXDFImBDF8caRHBOOGaTe4GOKr8ChxUMz7qH74';

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = (typeof window !== 'undefined' ? localStorage.getItem('supabase_url') : null) || defaultSupabaseUrl;
  const key = (typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') : null) || defaultSupabaseAnonKey;

  if (!url || !key || url.includes('your-supabase-project')) {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('[Supabase] Client init failed:', err);
      return null;
    }
  }

  return clientInstance;
}

export function updateSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_url', url.trim());
    localStorage.setItem('supabase_anon_key', key.trim());
    // Reset instance so next call re-creates with new credentials
    clientInstance = null;
    if (url && key) {
      clientInstance = createClient(url.trim(), key.trim());
    }
  }
}

export async function testSupabaseConnection(url?: string, key?: string): Promise<{ ok: boolean; message: string; tableCount?: number }> {
  try {
    const testUrl = (url || (typeof window !== 'undefined' ? localStorage.getItem('supabase_url') : null) || defaultSupabaseUrl).trim();
    const testKey = (key || (typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') : null) || defaultSupabaseAnonKey).trim();

    if (!testUrl || !testKey) {
      return { ok: false, message: 'Supabase URL and Anon Key are missing.' };
    }

    const testClient = createClient(testUrl, testKey);
    // Attempt to query hospitals or blood_inventory
    const { data, error } = await testClient.from('hospitals').select('id').limit(1);

    if (error) {
      // Check if table missing or DNS failure
      if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
        return { ok: false, message: 'Network / DNS error: Project may be paused or URL is invalid. Check Supabase Dashboard.' };
      }
      if (error.message.includes('relation "hospitals" does not exist') || error.code === '42P01') {
        return { ok: true, message: 'Connected to Supabase, but "hospitals" table is not created yet. Run the schema SQL script.' };
      }
      return { ok: false, message: `Supabase Error: ${error.message}` };
    }

    return { ok: true, message: 'Connected successfully to live Supabase database!', tableCount: data ? data.length : 0 };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Connection failed.' };
  }
}

export const supabase = getSupabaseClient();
