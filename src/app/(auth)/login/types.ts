import { Session, User, UserResponse } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

export type SupabaseUser = User & {
  user_metadata: {
    role?: 'admin' | 'user';
    [key: string]: any;
  };
};

export type LoginResult = {
    success: boolean;
  error?: string;
  data?: {
    user: any;
    profile: any;
    session: any;
    
  };
}
  