// MODIFIED: ProfilePage.tsx (adds email modal with re-auth + update)

"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NavBar from "@/components/nav";
import { ButtonT } from "@/components/ui/ButtonT";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/app/context/authContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { validateProfileForm, ValidationError } from "./utils/validation";

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
  const [previousPhotoPath, setPreviousPhotoPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<FormData>({ firstName: "", dob: "", school: "", email: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { fetchUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const getSessionUserId = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user?.id) return console.error("❌ Cannot get session user ID", error);
      setUserId(user.id);
      fetchProfile(user.id, user.email || "");
    };
    getSessionUserId();
  }, []);

  const fetchProfile = async (userId: string, authEmail: string) => {
    try {
      const res = await axios.get(`/api/users/${userId}/profile`);
      const profile = res.data?.profile;
      if (profile) {
        setFormData({
          firstName: profile.full_name || "",
          dob: profile.date_of_birth || "",
          school: profile.educational_background || "",
          email: authEmail
        });
        setPhoto(profile.profile_picture || "");
        setPreviousPhotoPath(profile.profile_picture || null);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const handleEmailChange = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("❌ No active session. Please sign in again.");
      return;
    }
  
    const { error } = await supabase.auth.updateUser({ email: newEmail });
  
    if (error) {
      console.error("❌ Email update failed:", error.message);
      return;
    }
  
    console.log("✅ Confirmation email sent to", newEmail);
    setShowEmailModal(false);
  };
  
  const validate = (): ValidationError[] => {
    return validateProfileForm(formData, file);
  };
  
  const getFieldError = (fieldName: keyof FormData): string | null => {
    const error = validationErrors.find((e) => e.field === fieldName);
    return error ? error.message : null;
  };
  

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
    setErrors({ ...errors, [field]: "" });
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!file || !userId) return previousPhotoPath;
    const ext = file.name.split(".").pop();
    const filename = `${Date.now()}.${ext}`;
    const path = `${userId}/${filename}`;
    const { error } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: publicData } = supabase.storage.from("profile-images").getPublicUrl(path);
    if (previousPhotoPath && previousPhotoPath !== publicData?.publicUrl) {
      const oldPath = previousPhotoPath.split("/").slice(-2).join("/");
      await supabase.storage.from("profile-images").remove([oldPath]);
    }
    return publicData?.publicUrl || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setValidationErrors(errors);
    if (errors.length > 0 || !userId) return;

    setLoading(true);
    try {
      const uploadedImageUrl = await uploadImage();
  
      // Construct the payload with only updated (non-empty) fields
      const payload: Record<string, any> = {};
      if (formData.firstName) payload.full_name = formData.firstName;
      if (formData.dob) payload.date_of_birth = formData.dob;
      if (formData.school) payload.educational_background = formData.school;
      if (uploadedImageUrl) payload.profile_picture = uploadedImageUrl;
  
      if (Object.keys(payload).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("user_id", userId);
  
        if (error) {
          console.error("❌ Failed to update profile:", error.message);
        } else {
          setPreviousPhotoPath(uploadedImageUrl);
          setPhoto(uploadedImageUrl || "");
          setFile(null);
          await fetchUser();
        }
      }
    } catch (err: any) {
      console.error("❌ Error during form submission:", err.message || err);
    } finally {
      setLoading(false);
    }
  };
    

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <section className="flex-1 bg-white flex flex-col items-center justify-center py-20">
        <h2 className="text-3xl font-bold text-center text-black mb-12">Profile</h2>
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 lg:gap-28">
          <div className="flex flex-col items-center w-[358px] shrink-0">
            <img src={photo || "/img/defaultProfileImage.png"} alt="User Avatar" className="rounded-xl object-cover w-[358px] h-[358px] border" />
            <input id="file-input" type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setPhoto(URL.createObjectURL(f)); } }} />
            <ButtonT variant="primary" className="mt-4 w-[175px] h-[60px]" onClick={() => document.getElementById("file-input")?.click()}>
              {uploading ? "Uploading..." : previousPhotoPath ? "Change photo" : "Upload photo"}
            </ButtonT>
            {validationErrors
              .filter((error) => error.field === "file")
              .map((error, index) => (
                <p key={index} className="text-red-500 text-xs mt-1">
                  {error.message}
                </p>
              ))}
            <button type="button" onClick={() => { setPhoto(""); setFile(null); setPreviousPhotoPath(null); }} className="text-sm mt-2 text-[#2563EB] hover:underline">Remove photo</button>
          </div>

          <div className="w-full max-w-md space-y-6">
          <div>
  <Label htmlFor="firstName">Full Name</Label>
  <Input
    id="firstName"
    value={formData.firstName}
    onChange={handleInputChange("firstName")}
    className={getFieldError("firstName") ? "border-red-500" : ""}
  />
  {validationErrors
    .filter((error) => error.field === "firstName")
    .map((error, index) => (
      <p key={index} className="text-red-500 text-xs mt-1">
        {error.message}
      </p>
    ))}
</div>

<div>
  <Label htmlFor="dob">Date of Birth</Label>
  <Input
    id="dob"
    type="date"
    value={formData.dob}
    onChange={handleInputChange("dob")}
    className={getFieldError("dob") ? "border-red-500" : ""}
  />
  {validationErrors
    .filter((error) => error.field === "dob")
    .map((error, index) => (
      <p key={index} className="text-red-500 text-xs mt-1">
        {error.message}
      </p>
    ))}
</div>

<div>
  <Label htmlFor="school">School</Label>
  <Input
    id="school"
    value={formData.school}
    onChange={handleInputChange("school")}
    className={getFieldError("school") ? "border-red-500" : ""}
  />
  {getFieldError("school") && (
    <p className="text-red-500 text-xs mt-1">{getFieldError("school")}</p>
  )}
</div>
            
<div>
  <Label htmlFor="email">Email</Label>
  <div className="flex gap-2 items-center">
    <Input
      id="email"
      type="email"
      value={formData.email}
      readOnly
      disabled
      className={`bg-gray-100 cursor-not-allowed text-gray-500 ${
        getFieldError("email") ? "border-red-500" : ""
      }`}
    />
    <ButtonT
      variant="ghost"
      className="!h-[36px] flex items-center justify-center whitespace-nowrap"
      onClick={() => {
        setNewEmail(formData.email);
        setShowEmailModal(true);
      }}
    >
      Change
    </ButtonT>
  </div>
  {getFieldError("email") && (
    <p className="text-red-500 text-xs mt-1">{getFieldError("email")}</p>
  )}
</div>

            <ButtonT variant="primary" className="w-full mt-4">{loading ? "Updating..." : "Update Profile"}</ButtonT>
          </div>
        </form>
      </section>

      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="new-email">New Email</Label>
            <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <ButtonT onClick={handleEmailChange} className="w-full mt-2">Send Confirmation</ButtonT>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
