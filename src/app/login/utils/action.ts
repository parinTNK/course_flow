"use server";

import { supabase } from "@/lib/supabaseClient";
import { LoginResult } from "../types";

export async function login(formData: FormData): Promise<LoginResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  // ตรวจสอบว่ามีการกรอกอีเมลและรหัสผ่าน
  if (!email?.trim()) {
    return {
      success: false,
      error: "กรุณากรอกอีเมลของคุณ"
    };
  }
  
  if (!password) {
    return {
      success: false,
      error: "กรุณากรอกรหัสผ่านของคุณ"
    };
  }
  
  try {
    // ตรวจสอบก่อนว่าอีเมลนี้มีในระบบหรือไม่
    const { data: emailExists } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();
    
    // ถ้าอีเมลไม่มีในระบบ ให้แจ้งเตือนเกี่ยวกับอีเมล
    if (!emailExists) {
      return {
        success: false,
        error: "ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลหรือสมัครบัญชีใหม่"
      };
    }
    
    // ถ้าอีเมลมีในระบบ ให้ลองเข้าสู่ระบบ
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // ถ้ามีข้อผิดพลาด
    if (error) {
      console.error("Login error:", error);
      
      // ถ้าเป็นรหัสผ่านไม่ถูกต้อง
      if (error.message.includes("Invalid login credentials")) {
        return {
          success: false,
          error: "รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านของคุณ"
        };
      }
      
      // ถ้ายังไม่ได้ยืนยันอีเมล
      if (error.message.includes("Email not confirmed")) {
        return {
          success: false,
          error: "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ"
        };
      }
      
      // ข้อผิดพลาดอื่นๆ
      return {
        success: false,
        error: error.message || "เกิดข้อผิดพลาดระหว่างการเข้าสู่ระบบ กรุณาลองอีกครั้ง"
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
      error: "เกิดข้อผิดพลาดระหว่างการเข้าสู่ระบบ กรุณาลองอีกครั้ง",
    };
  }
}