"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return function WithAuth(props: P) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
      const checkAuth = async () => {
        try {
          const { data, error } = await supabase.auth.getSession();

          if (error || !data.session) {
            // ไม่มี session, redirect ไปที่หน้า login
            router.push("/login");
            return;
          }

          // มี session, ดึงข้อมูลผู้ใช้
          const { data: userData } = await supabase.auth.getUser();
          setUser(userData.user);
          setIsAuthorized(true);
        } catch (err) {
          console.error("Auth error:", err);
          router.push("/login");
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">loding...</p>
          </div>
        </div>
      );
    }

    return isAuthorized ? <Component {...props} user={user} /> : null;
  };
};
