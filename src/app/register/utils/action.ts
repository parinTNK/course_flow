"use server";

import { validateRegisterForm } from "./validation";
import { supabase } from "@/lib/supabaseClient";

export async function register(formData: FormData) {
    const name = formData.get("name") as string;
    const dob = formData.get("dob") as string;
    const education = formData.get("education") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    // check data validations
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
    
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    
  
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });
        
        if (authError) {
            console.error("Auth error:", authError);
            
            if (authError.message && (
                authError.message.includes("User already registered") ||
                authError.message.includes("already exists") ||
                authError.message.includes("already registered") ||
                authError.message.toLowerCase().includes("email") && 
                authError.message.toLowerCase().includes("already")
            )) {
                return { 
                    success: false, 
                    error: "email already registered"
                };
            }
            
            return { 
                success: false, 
                error: authError.message || "please try again"
            };
        }

        if (!authData.user) {
            return {
                success: false,
                error: "not able to create user",
            };
        }

        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert([{ 
                user_id: authData.user.id, 
                full_name: name,
                age: age,
                educational_background: education,
            }])
            .select();
            
        if (profileError) {
            console.error("Profile error:", profileError);
            return { 
                success: false, 
                error: "profile creation failed" 
            };
        }
        
        return { 
            success: true, 
            data: {
                user: authData.user,
                profile: profileData[0]
            } 
        };
    } catch (error) {
        console.error("Registration error:", error);
        return { 
            success: false, 
            error: "please try again" 
        };
    }
}