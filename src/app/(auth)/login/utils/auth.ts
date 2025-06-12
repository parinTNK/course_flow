import { supabase } from "@/lib/supabaseClient";

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid") || error.message.includes("incorrect")) {
        return {
          success: false,
          error: "Email or password is incorrect",
        };
      }

      if (error.message.includes("Email not confirmed")) {
        return {
          success: false,
          error: "Please confirm your email address before logging in",
        };
      }

      return {
        success: false,
        error: error.message || "An error occurred during login. Please try again.",
      };
    }

    if (!data?.user) {
      return {
        success: false,
        error: "Failed to retrieve user data",
      };
    }

    // ดึงข้อมูล profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    return {
      success: true,
      data: {
        user: data.user,
        profile: profileError ? null : profileData,
        session: data.session
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: "An error occurred during login. Please try again.",
    };
  }
}