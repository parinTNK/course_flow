"use server";

import { validateRegisterForm, ValidationError } from "./validation";
import { supabase } from "@/lib/supabaseClient";

export async function register(formData: FormData) {
    const name = formData.get("name") as string;
    const dob = formData.get("dob") as string;
    const education = formData.get("education") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    // ตรวจสอบข้อมูล
    const errors = validateRegisterForm({
        name,
        dob,
        education,
        email,
        password
    });
    
    if (errors.length > 0) {
        return { 
            success: false, 
            errors 
        };
    }
    
    console.log({ name, dob, education, email, password });
    
    // คำนวณอายุจากวันเกิด
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    try {
        
        const { data, error } = await supabase
            .from('profiles')
            .insert([{ 
                // user_id: authData?.user?.id, // ถ้าใช้ระบบ Auth
                full_name: name,
                age: age,
                educational_background: education,
                profile_picture: "" // เพิ่มหากต้องการ
            }])
            .select();
            
        if (error) {
            console.error("Supabase error:", error);
            return { 
                success: false, 
                error: "การลงทะเบียนล้มเหลว กรุณาลองอีกครั้ง" 
            };
        }
        
        return { success: true, data };
    } catch (error) {
        console.error("Registration error:", error);
        return { 
            success: false, 
            error: "การลงทะเบียนล้มเหลว กรุณาลองอีกครั้ง" 
        };
    }
}