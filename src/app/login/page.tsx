"use client";
import { useState } from "react";
import NavBar from "@/components/nav";
import { login } from "./utils/action";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

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

    try {
      const submitFormData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        submitFormData.append(key, value);
      });

      const result = await login(submitFormData);

      if (result.success) {
        setForm({
          email: "",
          password: "",
        });

        router.push("/");
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาด โปรดลองอีกครั้งในภายหลัง");
    } finally {
      setLoading(false);
    }
  };

  // UI
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <div className="absolute top-70 -left-102 w-125 h-125 rounded-full !bg-[var(--orange-100)]"></div>
      <div>
        <img
          src="/Group 5.svg"
          alt="loading"
          className="absolute top-70 left-70"
        />
      </div>
      <div className="absolute top-46 left-45 w-15 h-15 rounded-full bg-[var(--blue-200)]"></div>
      <div className="absolute top-10 -right-56 w-90 h-90 rounded-full bg-[var(--blue-500)]"></div>
      <div className="absolute top-15 -right-58 w-90 h-100 rounded-full bg-[var(--blue-500)] -rotate-45"></div>
      <div className="absolute right-32 bottom-100 w-10 h-10 rounded-full border-amber-500 border-4"></div>
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
