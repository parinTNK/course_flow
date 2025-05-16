"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "./utils/action";
import { supabase } from "@/lib/supabaseClient";
import { UserCredentials, LoginState } from "./type";
import { useCustomToast } from "@/components/ui/CustomToast";

const AdminLogin = () => {
  const [credentials, setCredentials] = useState<UserCredentials>({
    email: "",
    password: "",
  });

  const [loginState, setLoginState] = useState<LoginState>({
    loading: false,
    error: null,
  });

  const router = useRouter();
  const toast = useCustomToast();

  useEffect(() => {
    const checkExistingSession = async () => {
      const token = localStorage.getItem("admin_token");

      if (token) {
        try {
          const { data, error } = await supabase.auth.getSession();

          if (data.session && !error) {
            const { data: userData } = await supabase.auth.getUser();
            const userRole = userData.user?.user_metadata?.role;

            if (userRole === "admin") {
              router.push("/admin/dashboard");
            } else {
              localStorage.removeItem("admin_token");
              toast.warning(
                "Access Denied",
                "You do not have permission to access the admin panel."
              );
            }
          } else {
            localStorage.removeItem("admin_token");
          }
        } catch (err) {
          console.error("Error checking session:", err);
          localStorage.removeItem("admin_token");
        }
      }
    };

    checkExistingSession();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginState({ loading: true, error: null });

    try {
      const result = await adminLogin(credentials);

      if (!result.success) {
        setLoginState({
          loading: false,
          error: result.error || "Login failed",
        });
        toast.error("Login failed", result.error || "");
        return;
      }
      if (result.session) {
        localStorage.setItem("admin_token", result.session.access_token);
        localStorage.setItem(
          "admin_refresh_token",
          result.session.refresh_token
        );
        localStorage.setItem("admin_user_id", result.userId || "");
        localStorage.setItem("admin_email", result.email || "");
        localStorage.setItem(
          "admin_expires_at",
          String(result.session.expires_at)
        );
      }

      toast.success("Login successful", "Welcome to the admin panel");
      router.push("/admin/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginState({
        loading: false,
        error: error.message || "An unexpected error occurred",
      });
      toast.error("Login error", error.message || "");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear2">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-400 mb-1">CourseFlow</h1>
          <p className="text-gray-500">Admin Panel Control</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="Enter Email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {loginState.error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {loginState.error}
            </div>
          )}

          <button
            type="submit"
            disabled={loginState.loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 cursor-pointer"
          >
            {loginState.loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
