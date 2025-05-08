"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/nav";
import { useRouter } from "next/navigation";
import { login } from "./utils/action";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login(form.email, form.password);

      if (result.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(result.user));
        }
        router.push("/dashboard");
      } else {
        setError(result.error || "เกิดข้อผิดพลาดในการล็อกอิน");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("เกิดข้อผิดพลาดในการล็อกอิน กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <div className="absolute top-70 -left-102 w-125 h-125 rounded-full bg-orange-400"></div>
      <div className="max-w-md mx-auto px-4 py-8 mt-40">
        <h2 className="text-[#2d3ecb] text-h2 font-bold mb-10">
          Welcome back!
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
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
        <p className="mt-4 text-gray-600 ">
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            className="text-[#3B5BDB] font-semibold hover:underline"
          >
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
