/**
 * Supabase Integration Guide & Setup Script
 * 
 * To connect your Supabase Project:
 * 1. Create a project at https://supabase.com
 * 2. Go to SQL Editor in Supabase Dashboard and paste the contents of `database/schema.sql` and `database/seed.sql`.
 * 3. Copy your SUPABASE_URL and SUPABASE_ANON_KEY from Project Settings -> API.
 * 4. Update the `.env` file in `backend/.env` with your URL and Anon Key.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-supabase-project'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

console.log(`[Supabase] Client initialized: ${supabase ? 'CONNECTED' : 'DISCONNECTED (Using Built-in High-Performance Memory DB Engine)'}`);
