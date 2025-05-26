import { createClient } from '@supabase/supabase-js';
import { parse, serialize } from 'cookie';

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

const setCookie = (name: string, value: string, options: any = {}) => {
  if (!isBrowser) return;
  
  const cookieOptions = {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    ...options
  };
  
  document.cookie = serialize(name, value, cookieOptions);
};

const getCookie = (name: string) => {
  if (!isBrowser) return null;
  const cookies = parse(document.cookie);
  return cookies[name] || null;
};

const removeCookie = (name: string) => {
  if (!isBrowser) return;
  setCookie(name, '', { maxAge: 0 });
};

const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: storageKey,
    storage: {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          // Try localStorage first
          const localValue = window.localStorage.getItem(key);
          if (localValue) return localValue;
          
          // Fallback to cookie
          return getCookie(key);
        }
        return null;
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          // Set in both localStorage and cookie
          window.localStorage.setItem(key, value);
          setCookie(key, value);
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
          removeCookie(key);
        }
      },
    },
    cookieOptions: {
      name: 'supabase-auth-token',
      lifetime: 60 * 60 * 24 * 7,
      domain: '',
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    },
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    setCookie(`${storageKey}-access-token`, session.access_token);
    setCookie(`${storageKey}-refresh-token`, session.refresh_token);
  } else if (event === 'SIGNED_OUT') {
    removeCookie(`${storageKey}-access-token`);
    removeCookie(`${storageKey}-refresh-token`);
  }
});

export const getStorageKeyName = () => storageKey;

export const hasAuthToken = () => {
  if (!isBrowser) return false;
  return !!localStorage.getItem(storageKey) || !!getCookie(storageKey);
};