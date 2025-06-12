"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UserCredentials, LoginState } from "./type";
import { useCustomToast } from "@/components/ui/CustomToast";
import "./type";

const AdminLogin = () => {
  const [credentials, setCredentials] = useState<UserCredentials>({
    email: "",
    password: "",
  });

  const [loginState, setLoginState] = useState<LoginState>({
    loading: false,
    error: null,
  });

  const toast = useCustomToast();

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Session check on mount:", session);

        if (session) {
          const userRole =
            session.user?.user_metadata?.role ||
            session.user?.app_metadata?.role ||
            (session.user as any)?.raw_user_meta_data?.role ||
            (session.user as any)?.raw_app_meta_data?.role;

          console.log("User role from session:", {
            role: userRole,
            user_metadata: session.user?.user_metadata,
            app_metadata: session.user?.app_metadata,
          });

          if (userRole === "admin") {
            window.location.href = "/admin/dashboard";
          } else {
            await supabase.auth.signOut();
            toast.warning(
              "Access Denied",
              "You do not have permission to access the admin panel."
            );
          }
        }
      } catch (err) {
        console.error("Error checking session:", err);
      }
    };

    checkExistingSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      if (event === "SIGNED_IN" && session) {
        const userRole =
          session.user?.user_metadata?.role ||
          session.user?.raw_user_meta_data?.role;
        if (userRole === "admin") {
          console.log("Admin signed in via auth state change");
          window.location.href = "/admin/dashboard";
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

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
      console.log("Starting CLIENT-SIDE login...");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      console.log("Supabase auth response:", data);
      console.log("Supabase auth error:", error);

      if (error) {
        setLoginState({
          loading: false,
          error: error.message || "Login failed",
        });
        toast.error("Login failed", error.message || "");
        return;
      }

      if (!data.user) {
        setLoginState({
          loading: false,
          error: "User not found",
        });
        toast.error("Login failed", "User not found");
        return;
      }

      const userRole =
        data.user.raw_user_meta_data?.role || data.user.user_metadata?.role;

      if (userRole !== "admin") {
        setLoginState({
          loading: false,
          error: "You are not authorized to access this page",
        });
        toast.error(
          "Access denied",
          "You are not authorized to access the admin panel"
        );
        await supabase.auth.signOut();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError || !refreshData.session) {
        toast.error("Session Error", "Failed to establish session");
        return;
      }
      toast.success("Login successful", "Welcome to the admin panel");
      setLoginState({ loading: false, error: null });
      window.location.href = "/admin/dashboard?auth=success";
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
          <h1
            className="text-5xl mb-1 text-gradient font-extrabold"
            style={{ backgroundClip: "text", WebkitBackgroundClip: "text" }}
          >
            CourseFlow
          </h1>
          <p className="text-gray-500 text-xl font-bold">Admin Panel Control</p>
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
