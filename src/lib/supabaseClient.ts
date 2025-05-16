import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const isBrowser = typeof window !== 'undefined';

function getProjectRef() {
  try {
    const url = new URL(supabaseUrl);
    return url.hostname.split('.')[0];
  } catch (e) {
    console.error('Error parsing Supabase URL', e);
    return '';
  }
}
const projectRef = getProjectRef();
const storageKey = `sb-${projectRef}-auth-token`;

const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: storageKey,
    storage: isBrowser ? window.localStorage : undefined
    
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

export const getStorageKeyName = () => storageKey;

export const hasAuthToken = () => {
  if (!isBrowser) return false;
  return !!localStorage.getItem(storageKey);
};