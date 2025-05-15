"use server";

import { supabase } from "@/lib/supabaseClient";
import { validateLoginForm, translateAuthError } from "./validations";
import { UserCredentials, AdminLoginResponse, AdminSessionResponse, AdminProfile } from "../type";

export async function adminLogin(credentials: UserCredentials): Promise<AdminLoginResponse> {

  const validation = validateLoginForm(credentials);
  
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errorMessage,
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return {
        success: false,
        error: translateAuthError(error.message),
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const userRole = data.user.user_metadata?.role;
    
    if (userRole !== "admin") {
      
      return {
        success: false,
        error: "You are not authorized to access this page",
      };
    }

    return {
      success: true,
      userId: data.user.id,
      email: data.user.email || "",
      session: {
        access_token: data.session?.access_token || "",
        refresh_token: data.session?.refresh_token || "",
        expires_at: data.session?.expires_at || 0
      }
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return {
      success: false,
      error: translateAuthError(error.message),
    };
  }
}

export async function verifyAdminAuth(token: string): Promise<AdminSessionResponse> {
  if (!token) {
    return { isAdmin: false };
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return { isAdmin: false };
    }
    
    const userRole = data.user.user_metadata?.role;
    
    const adminProfile: AdminProfile = {
      id: data.user.id,
      email: data.user.email || "",
      role: userRole || ""
    };
    
    return { 
      isAdmin: userRole === 'admin',
      user: adminProfile
    };
  } catch (error) {
    console.error("Error verifying admin token:", error);
    return { isAdmin: false };
  }
}