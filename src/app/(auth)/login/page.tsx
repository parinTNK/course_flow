"use client";
import { useState, useEffect } from "react";
import { signInWithEmail } from "./utils/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { validateEmail, validatePassword } from "./utils/validation";
import { useCustomToast } from "@/components/ui/CustomToast";
import { supabase } from "@/lib/supabaseClient";
import LoadingSpinner from "../../admin/components/LoadingSpinner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useCustomToast();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl") || "/";
  const [checkingSession, setCheckingSession] = useState(true);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    let isMounted = true;

    const checkToken = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session && isMounted) {
          router.push(redirectUrl);
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        if (isMounted) setCheckingSession(false);
      }
    };

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [router, redirectUrl]);
  if (checkingSession) {
    return <LoadingSpinner text="loading..." className="mt-40" size="lg" />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);

    if (emailError || passwordError) {
      setError(emailError || passwordError || "");
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithEmail(form.email, form.password);

      if (result.success && result.data) {
        const userData = {
          user_uid: result.data.user.id,
          isAdmin:
            result.data.user.user_metadata?.role === "admin" ? "true" : "false",
        };
        Object.entries(userData).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });

        toast.success("Success", "You have been logged in successfully!");

        setForm({
          email: "",
          password: "",
        });

        document.cookie = "redirecting=; max-age=0; path=/;";

        window.location.href = redirectUrl;
      } else if (result.error) {
        console.error("Login failed:", result.error);
        setError(result.error);
        toast.error("Login Failed", result.error);
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.";

      setError(errorMessage);
      toast.error("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // UI
  return (
    <div className=" bg-white">
      <div className="absolute md:top-70 md:-left-102 md:w-125 md:h-125 md:rounded-full bottom-5 -left-40 w-50 h-50 rounded-full !bg-[var(--orange-100)]"></div>
      <div>
        <img
          src="/Group 5.svg"
          alt="loading"
          className="md:absolute md:top-70 md:left-70"
        />
      </div>
      <div className="absolute md:top-46 md:left-45 md:w-15 md:h-15 md:rounded-full w-10 h-10 top-20 -left-5 rounded-full bg-[var(--blue-200)]"></div>
      <img
        src="/Vector-8.svg"
        alt="loading"
        className="absolute md:top-3 md:right-0 -top-45 -right-30 "
      />
      <div className="absolute md:right-20 md:bottom-90 md:w-10 md:h-10 right-10 bottom-110 rounded-full w-4 h-4 md:rounded-full border-amber-500 border-4 "></div>
      <div className="md:max-w-md md:mx-auto px-4 py-8 mt-40  max-w-md mx-auto ">
        <h2 className="text-[#2d3ecb] text-h2 font-bold mb-10 ">
          Welcome back!
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6 ">
          <div>
            <label className="block mb-2">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Enter Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2">Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded"
            />
          </div>
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[#3B5BDB] text-sm font-semibold hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3B5BDB] text-white py-3 px-4 rounded-lg font-semibold text-base hover:bg-[#364FC7] transition-colors mt-4 cursor-pointer"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
          {error && (
            <div className="text-red-500 text-sm text-center mt-2">{error}</div>
          )}
        </form>
        <p className="mt-4 text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-[#3B5BDB] font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
