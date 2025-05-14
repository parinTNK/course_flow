import { supabase } from "./supabaseClient"; 

export const signIn = async (email: string, password: string) => {
  const response = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (response.data.session && response.data.user) {
    localStorage.setItem("admin_token", response.data.session.access_token);
    localStorage.setItem("admin_refresh_token", response.data.session.refresh_token);
    localStorage.setItem("admin_user_id", response.data.user.id);
    localStorage.setItem("admin_email", response.data.user.email || "");
    localStorage.setItem("admin_expires_at", String(response.data.session.expires_at));
  }
  
  return response;
};

export const signOut = async () => {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_refresh_token");
  localStorage.removeItem("admin_user_id");
  localStorage.removeItem("admin_email");
  localStorage.removeItem("admin_expires_at");
  
  return await supabase.auth.signOut();
};

export const signUp = async (email: string, password: string, userData?: any) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
    }
  });
};

export const isAuthenticated = async (): Promise<boolean> => {

  const token = localStorage.getItem("admin_token");
  
  if (!token) {
    return false;
  }
  
  const expiresAt = localStorage.getItem("admin_expires_at");
  if (expiresAt) {
    const expiryTime = parseInt(expiresAt, 10) * 1000; 
    const currentTime = Date.now();
    
    if (currentTime >= expiryTime) {
     
      try {
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error || !data.session) {
          
          clearAuthTokens();
          return false;
        }
        
        updateAuthTokens(data.session);
        return true;
      } catch (err) {
        clearAuthTokens();
        return false;
      }
    }
  }
  
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

export const isAdmin = async (): Promise<boolean> => {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    return false;
  }
  
  const { data } = await supabase.auth.getUser();
  return data.user?.user_metadata?.role === 'admin';
};

export const refreshToken = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      clearAuthTokens();
      return null;
    }
    
    updateAuthTokens(data.session);
    return data.session;
  } catch (err) {
    clearAuthTokens();
    return null;
  }
};

const updateAuthTokens = (session: any) => {
  localStorage.setItem("admin_token", session.access_token);
  localStorage.setItem("admin_refresh_token", session.refresh_token);
  localStorage.setItem("admin_expires_at", String(session.expires_at));
  if (session.user?.id) {
    localStorage.setItem("admin_user_id", session.user.id);
  }
  if (session.user?.email) {
    localStorage.setItem("admin_email", session.user.email);
  }
};

const clearAuthTokens = () => {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_refresh_token");
  localStorage.removeItem("admin_user_id");
  localStorage.removeItem("admin_email");
  localStorage.removeItem("admin_expires_at");
};