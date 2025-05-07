"use client";
import { useState } from "react";
import NavBar from "@/components/nav";
import { ValidationError } from "./utils/validation";
import { register } from "./utils/action";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  // Function to get error message for a specific field
  const getFieldError = (fieldName: string) => {
    const error = validationErrors.find((err) => err.field === fieldName);
    return error ? error.message : null;
  };

  // UI
  return (
    <div className="min-h-screen mx-auto  bg-white ">
      <NavBar />

      <div className="absolute  top-70 -left-102 w-125 h-125 rounded-full bg-orange-400"></div>
      <div>
        <img
          src="/public/Group 5.svg"
          alt="loding"
          className="absolute top-70 left-70"
        />
      </div>
      <div className="max-w-md mx-auto px-4 py-8 mt-40">
        <h2 className="text-[#2d3ecb] text-h2 font-bold mb-10 w-[453px] h-[45px]">
          Register to start learning!
        </h2>

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <form
          action={async (formData) => {
            setLoading(true);
            setError("");
            setSuccess("");
            setValidationErrors([]);

            try {
              const result = await register(formData);

              if (result.success) {
                setSuccess("ลงทะเบียนสำเร็จ!");
              } else if (result.errors) {
                setValidationErrors(result.errors);
              } else if (result.error) {
                setError(result.error);
              }
            } catch (err) {
              setError("เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองอีกครั้ง");
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-4"
        >
          <div className="mb-12">
            <label className="block text-b2 mb-2">Name</label>
            <input
              name="name"
              type="text"
              placeholder="Enter Name and Lastname"
              required
              className={`w-full px-4 py-2 border ${
                getFieldError("name") ? "border-red-500" : ""
              }`}
            />
            {getFieldError("name") && (
              <p className="text-red-500 text-xs mt-1">
                {getFieldError("name")}
              </p>
            )}
          </div>

          <div className="mb-12">
            <label className="block text-b2 mb-2">Date of Birth</label>
            <input
              name="dob"
              type="date"
              placeholder="DD/MM/YY"
              required
              className={`w-full px-4 py-2 border ${
                getFieldError("dob") ? "border-red-500" : ""
              }`}
            />
            {getFieldError("dob") && (
              <p className="text-red-500 text-xs mt-1">
                {getFieldError("dob")}
              </p>
            )}
          </div>

          <div className="mb-12">
            <label className="block text-b2 mb-2">Educational Background</label>
            <input
              name="education"
              type="text"
              placeholder="Enter Educational Background"
              required
              className={`w-full px-4 py-2 border ${
                getFieldError("education") ? "border-red-500" : ""
              }`}
            />
            {getFieldError("education") && (
              <p className="text-red-500 text-xs mt-1">
                {getFieldError("education")}
              </p>
            )}
          </div>

          <div className="mb-12">
            <label className="block text-b2 mb-2">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Enter Email"
              required
              className={`w-full px-4 py-2 border ${
                getFieldError("email") ? "border-red-500" : ""
              }`}
            />
            {getFieldError("email") && (
              <p className="text-red-500 text-xs mt-1">
                {getFieldError("email")}
              </p>
            )}
          </div>

          <div className="mb-12">
            <label className="block text-b2 mb-2">Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter password"
              required
              className={`w-full px-4 py-2 border ${
                getFieldError("password") ? "border-red-500" : ""
              }`}
            />
            {getFieldError("password") && (
              <p className="text-red-500 text-xs mt-1">
                {getFieldError("password")}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3B5BDB] text-white py-3 px-4 rounded-lg font-semibold text-base hover:bg-[#364FC7] transition-colors mt-4 cursor-pointer"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          {error && (
            <div className="text-red-500 text-sm text-center mt-2">{error}</div>
          )}
        </form>

        <p className="mt-4  text-gray-600">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-[#3B5BDB] font-semibold hover:underline"
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
