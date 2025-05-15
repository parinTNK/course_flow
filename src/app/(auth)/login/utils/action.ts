import { supabase } from "@/lib/supabaseClient";
import { LoginResult } from "../types"; 

export async function login(formData: FormData): Promise<LoginResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  // ตรวจสอบว่ามีการกรอกอีเมลและรหัสผ่าน
  if (!email?.trim()) {
    return {
      success: false,
      error: "please enter your email"
    };
  }
  
  if (!password) {
    return {
      success: false,
      error: "please enter your password"
    };
  }
  
  try {
    // เรียกใช้ API ของ Supabase สำหรับการเข้าสู่ระบบ
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Login error:", error);
      
      if (error.message.includes("Invalid login credentials")) {
      
        const { data: emailExists } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', email)
          .maybeSingle();
        
        if (emailExists) {
          return {
            success: false,
            error: "please check your password"
          };
        } else {
          return {
            success: false,
            error: "no account found with this email"
          };
        }
      }
      
      if (error.message.includes("Email not confirmed")) {
        return {
          success: false,
          error: "please confirm your email address"
        };
      }
      
      return {
        success: false,
        error: error.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองอีกครั้ง"
      };
    }
    
    if (!data.user) {
      return {
        success: false,
        error: "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง",
      };
    }
    
    // ดึงข้อมูลโปรไฟล์ผู้ใช้
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();
    
    if (profileError) {
      console.error("Profile fetch error:", profileError);
      // สามารถเข้าสู่ระบบได้แม้จะไม่สามารถดึงข้อมูลโปรไฟล์ได้
    }
    
    return {
      success: true,
      data: {
        user: data.user,
        profile: profileData || null,
        session: data.session
      }
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "An error occurred during login. Please try again.",
    };
  }
}