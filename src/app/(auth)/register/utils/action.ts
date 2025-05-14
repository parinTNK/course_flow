"use server";

import { validateRegisterForm } from "./validation";
import { supabase } from "@/lib/supabaseClient";

export async function register(formData: FormData) {
    const name = formData.get("name") as string;
    const dob = formData.get("dob") as string;
    const education = formData.get("education") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
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
    
    try {
        console.log("Attempting to create auth user with email:", email);
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
                (authError.message.toLowerCase().includes("email") && 
                 authError.message.toLowerCase().includes("already"))
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
        
        console.log("Auth user created successfully. User ID:", authData.user.id);

        const formattedDob = new Date(dob).toISOString().split('T')[0]; 
        
        const profileData = { 
            user_id: authData.user.id, 
            full_name: name,
            educational_background: education,
            date_of_birth: formattedDob,
            profile_picture: "https://randomuser.me/api/portraits/men/1.jpg" 
        };
        
        console.log("Attempting to create profile with data:", profileData);
        
        const { data: profileData1, error: profileError1 } = await supabase
            .from('profiles')
            .insert([profileData])
            .select();
            
        if (profileError1) {
            console.error("Profile creation error details:", profileError1);
            return { 
                success: false, 
                error: "profile creation failed" 
            };
        }
        
        console.log("Profile created successfully:", profileData1);
        
        return { 
            success: true, 
            data: {
                user: authData.user,
                profile: profileData1[0]
            } 
        };
    } catch (error: any) {
        console.error("Registration error:", error);
        return { 
            success: false, 
            error: "please try again" 
        };
    }
}