"use server";

import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";

interface LoginValidationError {
  field: string;
  message: string;
}

export async function login(email: string, password: string) {
  if (!email || !password) {
    return {
      success: false,
      error: "กรุณากรอกอีเมลและรหัสผ่าน"
    };
  }
  
  try {
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Auth error:", error);
      return { 
        success: false, 
        error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" 
      };
    }
    
    // เก็บ session ใน cookie
    const cookieStore = await cookies();
    
    // แก้ไขการใช้ cookies API ใน Next.js
    cookieStore.set({
      name: "supabase-auth",
      value: JSON.stringify({
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 
    });
    
    // ดึงข้อมูลผู้ใช้จากตาราง profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', data.user.id)
      .single();
      
    if (profileError) {
      console.error("Profile error:", profileError);
    }
    
    return { 
      success: true,
      user: {
        id: data.user.id,
        name: profileData?.full_name || data.user.email,
        email: data.user.email
      }
    };
  } catch (error) {
    console.error("Login error:", error);
    return { 
      success: false, 
      error: "เกิดข้อผิดพลาดในการล็อกอิน กรุณาลองอีกครั้ง" 
    };
  }
}