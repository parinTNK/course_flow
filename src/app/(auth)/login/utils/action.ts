"use server"
import { supabase } from "@/lib/supabaseClient";
import { LoginResult } from "../types"; 
import { signIn } from "@/lib/auth";

export async function login(formData: FormData): Promise<LoginResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  console.log("Server login attempt with email:", email);

  if (!email?.trim()) {
    return {
      success: false,
      error: "Please enter your email"
    };
  }

  if (!password) {
    return {
      success: false,
      error: "Please enter your password"
    };
  }

  try {
    console.log("Calling signIn from server action");
    
    const response = await signIn(email, password, true);
    
    if (response.error) {
      console.error("Authentication error:", response.error);
      
      if (response.error.message.includes("Invalid") || response.error.message.includes("incorrect")) {
        return {
          success: false,
          error: "Email or password is incorrect",
        };
      }

      if (response.error.message.includes("Email not confirmed")) {
        return {
          success: false,
          error: "Please confirm your email address before logging in",
        };
      }

      return {
        success: false,
        error: response.error.message || "An error occurred during login. Please try again.",
      };
    }

    if (!response.data?.user) {
      console.error("No user data in response");
      return {
        success: false,
        error: "Failed to retrieve user data",
      };
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', response.data.user.id)
      .single();
    
    if (profileError) {
      console.warn("Profile fetch error:", profileError);
    }

    return {
      success: true,
      data: {
        user: response.data.user,
        profile: profileData || null,
        session: response.data.session
      }
    };
  } catch (error) {
    console.error("Server login error:", error);
    return {
      success: false,
      error: "An error occurred during login. Please try again.",
    };
  }
}