import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

let supabaseClient: SupabaseClient | null = null;

if (
  config.supabaseUrl &&
  config.supabaseAnonKey &&
  !config.supabaseUrl.includes('your-supabase-project') &&
  !config.supabaseAnonKey.includes('your-supabase-anon-key')
) {
  try {
    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
    console.log('[Supabase] Live client connection initialized successfully.');
  } catch (err) {
    console.warn('[Supabase] Failed to initialize live client:', err);
  }
} else {
  console.log('[Supabase] Using built-in High-Performance Transactional DB Engine (Supabase credentials not configured in backend/.env).');
}

export const supabase = supabaseClient;
