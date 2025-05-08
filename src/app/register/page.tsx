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

  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    education: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "email") {
      setValidationErrors((prev) =>
        prev.filter((err) => err.field !== "email")
      );
      setError("");
    }
  };

  // check email validation error
  const getFieldError = (fieldName: string) => {
    const error = validationErrors.find((err) => err.field === fieldName);
    return error ? error.message : null;
  };

  // UI
  return (
    <div className="min-h-screen mx-auto bg-white">
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
      <div className="absolute right-32 bottom-100 w-10 h-10 rounded-full border-amber-500 border-4"></div>
      <div className="max-w-md mx-auto px-4 py-8 mt-40">
        <h2 className="text-[#2d3ecb] text-h2 font-bold mb-10 w-[453px] h-[45px]">
          Register to start learning!
        </h2>

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
            {success}{" "}
            <a href="/login" className="underline text-blue-600">
              Log in now
            </a>
          </div>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            setSuccess("");
            setValidationErrors([]);

            try {
              const submitFormData = new FormData();
              Object.entries(formData).forEach(([key, value]) => {
                submitFormData.append(key, value);
              });

              const result = await register(submitFormData);

              if (result.success) {
                setSuccess("successfully registered, please verify your email");

                setFormData({
                  name: "",
                  dob: "",
                  education: "",
                  email: "",
                  password: "",
                });
              } else if (result.errors) {
                setValidationErrors(result.errors);
              } else if (result.error) {
                if (
                  result.error.includes("User already registered") ||
                  result.error.includes("already exists") ||
                  result.error.includes("already registered") ||
                  (result.error.toLowerCase().includes("email") &&
                    result.error.toLowerCase().includes("already"))
                ) {
                  setError(
                    "email already registered, please try another email"
                  );

                  setValidationErrors([
                    {
                      field: "email",
                      message: "email already registered",
                    },
                  ]);
                } else {
                  setError(result.error);
                }
              }
            } catch (err) {
              setError("An error occurred. Please try again later.");
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
              value={formData.name}
              onChange={handleChange}
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
              value={formData.dob}
              onChange={handleChange}
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
              value={formData.education}
              onChange={handleChange}
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
              value={formData.email}
              onChange={handleChange}
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
              value={formData.password}
              onChange={handleChange}
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

        <p className="mt-4 text-gray-600">
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
