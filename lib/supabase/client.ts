import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  throw new Error(
    `Missing Supabase client environment variables: ${missing.join(', ')}\n` +
    `Please create a .env.local file with these variables.\n` +
    `See .env.local.example for reference.`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
