import { supabase } from "./supabaseClient";

// ฟังก์ชันตรวจสอบว่ากำลังทำงานในฝั่ง client หรือไม่
const isClient = () => typeof window !== 'undefined';

export const signIn = async (email: string, password: string) => {
  try {
    console.log("Attempting to sign in with email:", email);
    
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log("Sign in response:", {
      success: !!response.data.user,
      error: response.error?.message
    });
    
    // จัดเก็บข้อมูลใน localStorage เฉพาะเมื่อทำงานในฝั่ง client
    if (isClient() && response.data.session && response.data.user) {
      console.log("Storing session in localStorage");
      localStorage.setItem("admin_token", response.data.session.access_token);
      localStorage.setItem("admin_refresh_token", response.data.session.refresh_token);
      localStorage.setItem("admin_user_id", response.data.user.id);
      localStorage.setItem("admin_email", response.data.user.email || "");
      localStorage.setItem("admin_expires_at", String(response.data.session.expires_at));
    }
    
    return response;
  } catch (error) {
    console.error("Error in signIn function:", error);
    return {
      data: { session: null, user: null },
      error: {
        message: error instanceof Error ? error.message : "Unknown error in signIn",
        status: 500
      }
    };
  }
};

export const signOut = async () => {
  try {
    // ลบข้อมูลจาก localStorage เฉพาะเมื่อทำงานในฝั่ง client
    if (isClient()) {
      console.log("Clearing session from localStorage");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_refresh_token");
      localStorage.removeItem("admin_user_id");
      localStorage.removeItem("admin_email");
      localStorage.removeItem("admin_expires_at");
    }
    
    return await supabase.auth.signOut();
  } catch (error) {
    console.error("Error in signOut function:", error);
    return { error: { message: "Failed to sign out", status: 500 } };
  }
};

export const signUp = async (email: string, password: string, userData?: any) => {
  try {
    console.log("Signing up with email:", email);
    
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
      }
    });
  } catch (error) {
    console.error("Error in signUp function:", error);
    return {
      data: { session: null, user: null },
      error: {
        message: error instanceof Error ? error.message : "Unknown error in signUp",
        status: 500
      }
    };
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    // ถ้าทำงานในฝั่ง server ให้ตรวจสอบจาก session โดยตรง
    if (!isClient()) {
      console.log("Checking authentication on server");
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    }
    
    console.log("Checking authentication on client");
    const token = localStorage.getItem("admin_token");
    
    if (!token) {
      console.log("No token found in localStorage");
      return false;
    }
    
    const expiresAt = localStorage.getItem("admin_expires_at");
    if (expiresAt) {
      const expiryTime = parseInt(expiresAt, 10) * 1000; 
      const currentTime = Date.now();
      
      console.log("Token expires at:", new Date(expiryTime).toISOString());
      console.log("Current time:", new Date(currentTime).toISOString());
      
      if (currentTime >= expiryTime) {
        console.log("Token expired, attempting to refresh");
        try {
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error || !data.session) {
            console.error("Failed to refresh session:", error);
            clearAuthTokens();
            return false;
          }
          
          console.log("Session refreshed successfully");
          updateAuthTokens(data.session);
          return true;
        } catch (err) {
          console.error("Error refreshing session:", err);
          clearAuthTokens();
          return false;
        }
      }
    }
    
    // ตรวจสอบสถานะ session ปัจจุบัน
    console.log("Verifying session with Supabase");
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

export const isAdmin = async (): Promise<boolean> => {
  try {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      console.log("User is not authenticated");
      return false;
    }
    
    console.log("Checking if user is admin");
    const { data } = await supabase.auth.getUser();
    const isAdmin = data.user?.user_metadata?.role === 'admin';
    console.log("Is admin:", isAdmin);
    return isAdmin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

export const refreshToken = async () => {
  try {
    console.log("Attempting to refresh token");
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      console.error("Failed to refresh token:", error);
      if (isClient()) {
        clearAuthTokens();
      }
      return null;
    }
    
    console.log("Token refreshed successfully");
    if (isClient()) {
      updateAuthTokens(data.session);
    }
    return data.session;
  } catch (err) {
    console.error("Error in refreshToken function:", err);
    if (isClient()) {
      clearAuthTokens();
    }
    return null;
  }
};

const updateAuthTokens = (session: any) => {
  // จัดเก็บข้อมูลใน localStorage เฉพาะเมื่อทำงานในฝั่ง client
  if (!isClient()) return;
  
  try {
    console.log("Updating auth tokens in localStorage");
    localStorage.setItem("admin_token", session.access_token);
    localStorage.setItem("admin_refresh_token", session.refresh_token);
    localStorage.setItem("admin_expires_at", String(session.expires_at));
    if (session.user?.id) {
      localStorage.setItem("admin_user_id", session.user.id);
    }
    if (session.user?.email) {
      localStorage.setItem("admin_email", session.user.email);
    }
  } catch (error) {
    console.error("Error updating auth tokens:", error);
  }
};

const clearAuthTokens = () => {
  // ลบข้อมูลจาก localStorage เฉพาะเมื่อทำงานในฝั่ง client
  if (!isClient()) return;
  
  try {
    console.log("Clearing auth tokens from localStorage");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user_id");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_expires_at");
  } catch (error) {
    console.error("Error clearing auth tokens:", error);
  }
};

// เพิ่มฟังก์ชันทดสอบการเชื่อมต่อ
export const testSupabaseConnection = async () => {
  try {
    console.log("Testing Supabase connection");
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error("Supabase connection test failed:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Supabase connection test succeeded:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error testing Supabase connection:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error testing connection" 
    };
  }
};