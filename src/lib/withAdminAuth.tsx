"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { verifyAdminAuth } from "@/app/admin/login/utils/action";
import { AdminProfile } from "@/app/admin/login/type";

export const withAdminAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return function WithAdminAuth(props: P) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

    useEffect(() => {
      const checkAdminAuth = async () => {
        try {
          const token = localStorage.getItem("admin_token");
          if (!token) {
            router.push("/admin/login");
            return;
          }

          const expiresAt = localStorage.getItem("admin_expires_at");
          if (expiresAt) {
            const expiryTime = parseInt(expiresAt, 10) * 1000;
            const currentTime = Date.now();

            if (currentTime >= expiryTime) {
              // token หมดอายุแล้ว ลองทำการ refresh
              const { data, error } = await supabase.auth.refreshSession();

              if (error || !data.session) {
                // ไม่สามารถ refresh token ได้
                localStorage.removeItem("admin_token");
                router.push("/admin/login");
                return;
              }

              // อัปเดต token ใหม่
              localStorage.setItem("admin_token", data.session.access_token);
              localStorage.setItem(
                "admin_refresh_token",
                data.session.refresh_token
              );
              localStorage.setItem(
                "admin_expires_at",
                String(data.session.expires_at)
              );
            }
          }

          // ใช้ server action เพื่อตรวจสอบสิทธิ์
          const { isAdmin, user } = await verifyAdminAuth(token);

          if (!isAdmin) {
            localStorage.removeItem("admin_token");
            router.push("/admin/login");
            return;
          }

          if (user) {
            setAdminProfile(user);
          }
          setIsAuthorized(true);
        } catch (err) {
          console.error("Admin auth error:", err);
          localStorage.removeItem("admin_token");
          router.push("/admin/login");
        } finally {
          setIsLoading(false);
        }
      };

      checkAdminAuth();
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

    return isAuthorized ? (
      <Component {...props} adminProfile={adminProfile} />
    ) : null;
  };
};
