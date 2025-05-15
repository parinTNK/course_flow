"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NavBar from "@/components/nav";
import { ButtonT } from "@/components/ui/ButtonT";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import axios from "axios";

interface FormData {
  firstName: string;
  dob: string;
  school: string;
  email: string;
}

interface FormErrors extends Partial<FormData> {}

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [previousPhotoPath, setPreviousPhotoPath] = useState<string | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    dob: "",
    school: "",
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState<string>("User");

  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type.startsWith("image/")) {
      setFile(selected);
      setPhoto(URL.createObjectURL(selected)); // Preview only
    } else {
      alert("Please select a valid image.");
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const res = await axios.get(`/api/users/${userId}/profile`);
      const profile = res.data?.profile;

      if (profile) {
        setFormData({
          firstName: profile.full_name || "",
          dob: profile.date_of_birth || "",
          school: profile.educational_background || "",
          email: profile.email || "",
        });
        setPhoto(profile.profile_picture || "");
        setPreviousPhotoPath(profile.profile_picture || null);
        setUserName(profile.full_name?.split(" ")[0] || "User");
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setPhoto("");
    }
  };

  useEffect(() => {
    const mockUser = { id: "35557ac8-fb44-4052-9c73-8fc50a3edda1" }; // Replace with Supabase session if needed
    const userId = mockUser.id;
    setUserId(userId);
    fetchProfile(userId);
  }, []);

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};
    const today = new Date().toISOString().split("T")[0];
    if (formData.dob && formData.dob > today) {
      newErrors.dob = "Date of birth cannot be in the future";
    }
    return newErrors;
  };

  const handleInputChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
      setErrors({ ...errors, [field]: "" });
    };

  const uploadImage = async (): Promise<string | null> => {
    if (!file) return previousPhotoPath;

    const ext = file.name.split(".").pop();
    const filename = `${Date.now()}.${ext}`;
    const path = `${userId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-images")
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage
      .from("profile-images")
      .getPublicUrl(path);

    if (previousPhotoPath && previousPhotoPath !== publicData?.publicUrl) {
      const oldPath = previousPhotoPath.split("/").slice(-2).join("/");
      await supabase.storage.from("profile-images").remove([oldPath]);
    }

    return publicData?.publicUrl || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0 || !userId) return;

    setLoading(true);
    try {
      const uploadedImageUrl = await uploadImage();

      const payload: Partial<FormData> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value.trim()) payload[key as keyof FormData] = value;
      });

      const res = await axios.patch(`/api/users/${userId}/profile`, {
        ...payload,
        profile_picture: uploadedImageUrl,
      });

      console.log("✅ Profile updated:", res.data.profile);
      setPreviousPhotoPath(uploadedImageUrl);
      setPhoto(uploadedImageUrl || "");
      setFile(null);
    } catch (err: any) {
      console.error("Error during form submission:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      if (previousPhotoPath) {
        const oldPath = previousPhotoPath.split("/").slice(-2).join("/");
        const { error: deleteError } = await supabase.storage
          .from("profile-images")
          .remove([oldPath]);

        if (deleteError) {
          console.error("Failed to delete image from storage:", deleteError.message);
        } else {
          console.log("✅ Image deleted from storage");
        }
      }
      setPhoto("");
      setFile(null);
      setPreviousPhotoPath("");
    } catch (err) {
      console.error("Error during image removal:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar
        user={{
          name: userName,
          avatarUrl: photo || "/img/defaultProfileImage.png",
        }}
      />
      <section className="flex-1 bg-white flex flex-col items-center justify-center py-20">
        <h2 className="text-3xl font-bold text-center text-black mb-12">
          Profile
        </h2>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col lg:flex-row gap-8 lg:gap-28"
        >
          <div className="flex flex-col items-center w-[358px] shrink-0">
            <img
              src={photo || "/img/defaultProfileImage.png"}
              alt="User Avatar"
              onError={(e) => {
                console.error("Image load failed:", photo);
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/img/defaultProfileImage.png";
              }}
              className="rounded-xl object-cover w-[358px] h-[358px] border"
            />
            <input
              id="file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <ButtonT
              variant="primary"
              className="mt-4 w-[175px] h-[60px]"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              {uploading
                ? "Uploading..."
                : previousPhotoPath
                ? "Change photo"
                : "Upload photo"}
            </ButtonT>
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="text-sm mt-2 text-[#2563EB] hover:underline"
            >
              Remove photo
            </button>
          </div>

          <div className="w-full max-w-md space-y-6">
            {(
              [
                "firstName",
                "dob",
                "school",
                "email",
              ] as (keyof FormData)[]
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
          </div>
        </form>
      </section>
    </div>
  );
}
