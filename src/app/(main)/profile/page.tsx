"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NavBar from "@/components/nav";
import { ButtonT } from "@/components/ui/ButtonT";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/authContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  validateProfileForm,
  ValidationError,
  validateNewEmail,
} from "./utils/validation";
import { useCustomToast } from "@/components/ui/CustomToast";
import BackgroundSVGs from "@/components/BackgroundSVGs";

interface FormData {
  firstName: string;
  dob: string;
  school: string;
  email: string;
}

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [previousPhotoPath, setPreviousPhotoPath] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    dob: "",
    school: "",
    email: "",
  });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const toast = useCustomToast();
  const { user, fetchUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setUserId(user.user_id);
      setFormData({
        firstName: user.full_name || "",
        dob: user.date_of_birth || "",
        school: user.educational_background || "",
        email: user.email || "",
      });
      setPhoto(user.profile_picture || "");
      setPreviousPhotoPath(user.profile_picture || null);
    }
  }, [user]);

  const handleEmailChange = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Error", "No active session. Please sign in again.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast.error("Error", "Email update failed. Please try again.");
      return;
    }

    toast.success("Success", "Confirmation email sent successfully!");
    setShowEmailModal(false);
  };

  const validate = (): ValidationError[] => validateProfileForm(formData, file);

  const getFieldError = (fieldName: keyof FormData): string | null => {
    const error = validationErrors.find((e) => e.field === fieldName);
    return error ? error.message : null;
  };

  const handleInputChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
    };

  const uploadImage = async (): Promise<string | null> => {
    if (!file || !userId) return previousPhotoPath;
    const ext = file.name.split(".").pop();
    const filename = `${Date.now()}.${ext}`;
    const path = `${userId}/${filename}`;
    const { error } = await supabase.storage
      .from("profile-images")
      .upload(path, file, { upsert: true });
    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from("profile-images")
      .getPublicUrl(path);
    if (previousPhotoPath && previousPhotoPath !== publicData?.publicUrl) {
      const oldPath = previousPhotoPath.split("/").slice(-2).join("/");
      await supabase.storage.from("profile-images").remove([oldPath]);
    }
    return publicData?.publicUrl || null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Ensure the clicked button is the "Update Profile" button
    const target = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
    if (target?.textContent !== "Update Profile") return;

    const errors = validate();
    setValidationErrors(errors);
    if (errors.length > 0 || !userId) return;

    setLoading(true);
    try {
      const uploadedImageUrl = await uploadImage();
      const payload = buildPayload(uploadedImageUrl);

      if (Object.keys(payload).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("user_id", userId);
        if (error) {
          toast.error("Error", "Failed to update profile. Please try again.");
        } else {
          updateProfileState(uploadedImageUrl);
          toast.success("Success", "Profile updated successfully!");
        }
      }
    } catch (err: any) {
      toast.error("Error", "An error occurred during profile update.");
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = (
    uploadedImageUrl: string | null
  ): Record<string, any> => {
    const payload: Record<string, any> = {};
    // Only add fields that have changed
    if (formData.firstName) payload.full_name = formData.firstName;
    if (formData.dob) payload.date_of_birth = formData.dob;
    if (formData.school) payload.educational_background = formData.school;

    // Only add profile_picture if it's null or different from the previous one
    payload.profile_picture = uploadedImageUrl;
    return payload;
  };

  const updateProfileState = (uploadedImageUrl: string | null) => {
    setPreviousPhotoPath(uploadedImageUrl);
    setPhoto(uploadedImageUrl || "");
    setFile(null);
    fetchUser();
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <BackgroundSVGs />
      <NavBar />
      <section className="flex-1 bg-transparent flex flex-col items-center justify-center py-20 mt-15">
        <h2 className="text-3xl font-bold text-center text-black mb-12">
          Profile
        </h2>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col lg:flex-row gap-8 lg:gap-28"
        >
          <ProfileImageSection
            photo={photo}
            setPhoto={setPhoto}
            setFile={setFile}
            validationErrors={validationErrors}
            setPreviousPhotoPath={setPreviousPhotoPath}
          />
          <ProfileFormSection
            formData={formData}
            handleInputChange={handleInputChange}
            getFieldError={getFieldError}
            loading={loading}
            setShowEmailModal={setShowEmailModal}
          />
        </form>
      </section>
      <EmailModal
        showEmailModal={showEmailModal}
        setShowEmailModal={setShowEmailModal}
        newEmail={newEmail}
        setNewEmail={setNewEmail}
        handleEmailChange={handleEmailChange}
      />
    </div>
  );
}

const ProfileImageSection = ({
  photo,
  setPhoto,
  setFile,
  validationErrors,
  setPreviousPhotoPath,
}) => (
  <div className="flex flex-col items-center w-[358px] shrink-0">
    <img
      src={photo || "/img/defaultProfileImage.png"}
      alt="User Avatar"
      className="rounded-xl object-cover w-[358px] h-[358px] border"
    />
    <input
      id="file-input"
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) {
          setFile(f);
          setPhoto(URL.createObjectURL(f));
        }
      }}
    />
    <ButtonT
      variant="primary"
      className="mt-4 w-[175px] h-[60px]"
      onClick={() => document.getElementById("file-input")?.click()}
    >
      Change photo
    </ButtonT>
    {validationErrors
      .filter((error) => error.field === "file")
      .map((error, index) => (
        <p key={index} className="text-red-500 text-xs mt-1">
          {error.message}
        </p>
      ))}
    <button
      type="button"
      onClick={() => {
        setPhoto("");
        setFile(null);
        setPreviousPhotoPath(null);
      }}
      className="text-sm mt-2 text-[#2563EB] hover:underline"
    >
      Remove photo
    </button>
  </div>
);

const ProfileFormSection = ({
  formData,
  handleInputChange,
  getFieldError,
  loading,
  setShowEmailModal,
}) => (
  <div className="w-full max-w-md space-y-6">
    {["firstName", "dob", "school"].map((field) => (
      <div key={field}>
        <Label htmlFor={field} className="mb-2">
          {field === "dob"
            ? "Date of Birth"
            : field === "school"
            ? "School"
            : "Full Name"}
        </Label>
        <Input
          id={field}
          type={field === "dob" ? "date" : "text"}
          value={formData[field]}
          onChange={handleInputChange(field)}
          className={getFieldError(field) ? "border-red-500" : ""}
        />
        {getFieldError(field) && (
          <p className="text-red-500 text-xs mt-1">{getFieldError(field)}</p>
        )}
      </div>
    ))}
    <div>
      <Label htmlFor="email">Email</Label>
      <div className="flex gap-2 items-center">
        <Input
          id="email"
          type="email"
          value={formData.email}
          readOnly
          disabled
          className="bg-gray-100 cursor-not-allowed text-gray-500"
        />
        <ButtonT
          variant="ghost"
          className="!h-[36px] flex items-center justify-center whitespace-nowrap"
          onClick={() => setShowEmailModal(true)}
        >
          Change
        </ButtonT>
      </div>
    </div>
    <ButtonT variant="primary" className="w-full mt-4">
      {loading ? "Updating..." : "Update Profile"}
    </ButtonT>
  </div>
);

const EmailModal = ({
  showEmailModal,
  setShowEmailModal,
  newEmail,
  setNewEmail,
  handleEmailChange,
}) => {
  const [newEmailError, setNewEmailError] = useState<string | null>(null);

  const handleNewEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setNewEmail(email);
    setNewEmailError(validateNewEmail(email));
  };

  const handleSendConfirmation = () => {
    const error = validateNewEmail(newEmail);
    if (error) {
      setNewEmailError(error);
      return;
    }
    handleEmailChange();
  };

  return (
    <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Label htmlFor="new-email">New Email</Label>
          <Input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={handleNewEmailChange}
            className={newEmailError ? "border-red-500" : ""}
          />
          {newEmailError && (
            <p className="text-red-500 text-xs mt-1">{newEmailError}</p>
          )}
          <ButtonT onClick={handleSendConfirmation} className="w-full mt-2">
            Send Confirmation
          </ButtonT>
        </div>
      </DialogContent>
    </Dialog>
  );
};
