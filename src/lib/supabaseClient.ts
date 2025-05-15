import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const isBrowser = typeof window !== 'undefined';

const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: isBrowser ? window.localStorage : undefined
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);