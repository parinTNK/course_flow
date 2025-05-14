"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NavBar from "@/components/nav";
import { ButtonT } from "@/components/ui/ButtonT";

interface FormData {
  firstName: string; // Full name
  dob: string;
  school: string;
  email: string;
}

interface FormErrors extends Partial<FormData> {}

export default function ProfilePage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    dob: "",
    school: "",
    email: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
      setErrors({ ...errors, [field]: "" });
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted data:", formData);
    // Placeholder for actual form logic
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar user={{ name: "User", avatarUrl: "/img/defaultProfileImage.png" }} />
      <section className="flex-1 bg-white flex flex-col items-center justify-center py-20">
        <h2 className="text-3xl font-bold text-center text-black mb-12">Profile</h2>
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-6 px-4"
        >
          {(
            ["firstName", "dob", "school", "email"] as (keyof FormData)[]
          ).map((field) => (
            <div key={field}>
              <Label htmlFor={field} className="block mb-1">
                {field === "dob"
                  ? "Date of Birth"
                  : field === "firstName"
                  ? "Full Name"
                  : field.charAt(0).toUpperCase() +
                    field.slice(1).replace(/([A-Z])/g, " $1")}
              </Label>
              <Input
                id={field}
                type={field === "dob" ? "date" : "text"}
                placeholder={`Enter your ${
                  field === "firstName" ? "full name" : field
                }`}
                value={formData[field]}
                onChange={handleInputChange(field)}
                className={errors[field] ? "border border-red-500" : ""}
              />
              {errors[field] && (
                <span className="text-sm text-red-500">{errors[field]}</span>
              )}
            </div>
          ))}
          <ButtonT variant="primary" className="w-full mt-4">
            {loading ? "Updating..." : "Update Profile"}
          </ButtonT>
        </form>
      </section>
    </div>
  );
}
