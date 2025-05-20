import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const isBrowser = typeof window !== 'undefined';

function getProjectRef() {
  try {
    const url = new URL(supabaseUrl);
    return url.hostname.split('.')[0];
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error parsing Supabase URL', e);
    }
    return '';
  }
}
const projectRef = getProjectRef();
const storageKey = `sb-${projectRef}-auth-token`;

// Check if the environment is browser or server

const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: storageKey,
    storage: {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      },
    },
    cookieOptions: {
      name: 'supabase-auth-token',
      lifetime: 60 * 60 * 24 * 7,
      domain: '',
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

export const getStorageKeyName = () => storageKey;

export const hasAuthToken = () => {
  if (!isBrowser) return false;
  return !!localStorage.getItem(storageKey);
};