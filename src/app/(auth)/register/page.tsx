"use client";
import { useState } from "react";
import { ValidationError } from "./utils/validation";
import { register } from "./utils/action";
import { useRouter } from "next/navigation";
import { useCustomToast } from "@/components/ui/CustomToast";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const toast = useCustomToast();

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
        className="absolute md:top-3 md:right-0 top-50 -right-40 "
      />
      <div className="absolute md:right-20 md:bottom-90 md:w-10 md:h-10 right-10 bottom-115 rounded-full w-4 h-4 md:rounded-full border-amber-500 border-4 "></div>
      <div className="md:max-w-md md:mx-auto px-4 py-8 mt-40">
        <h2 className="text-[#2d3ecb] md:text-h2 text-h3 font-bold md:mb-10 mb-5 md:w-[453px] md:h-[45px] w-[470px] h-[45px] ">
          Register to start learning!
        </h2>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            setValidationErrors([]);

            try {
              const submitFormData = new FormData();
              Object.entries(formData).forEach(([key, value]) => {
                submitFormData.append(key, value);
              });

              const result = await register(submitFormData);

              if (result.success) {
                toast.success(
                  "Registration Successful",
                  "Please check your email to verify your account"
                );

                setFormData({
                  name: "",
                  dob: "",
                  education: "",
                  email: "",
                  password: "",
                });
                router.push("/login");
              } else if (result.errors) {
                setValidationErrors(result.errors);
                toast.warning(
                  "Invalid Information",
                  "Please check your input and try again"
                );
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
                  toast.error(
                    "Email Already Registered",
                    "Please use another email or login to your account"
                  );

                  setValidationErrors([
                    {
                      field: "email",
                      message: "email already registered",
                    },
                  ]);
                } else {
                  setError(result.error);
                  toast.error(
                    "Error Occurred",
                    result.error || "Please try again"
                  );
                }
              }
            } catch (err) {
              setError("An error occurred. Please try again later.");
              toast.error("Unexpected Error", "Please try again later");
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-4"
        >
          <div className="md:mb-12 mb-7">
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

          <div className="md:mb-12 mb-7">
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

          <div className="md:mb-12 mb-7">
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

          <div className="md:mb-12 mb-7">
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

          <div className="md:mb-12 mb-7">
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
