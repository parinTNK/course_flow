"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import LoadingSpinner from "@/app/admin/components/LoadingSpinner";

interface FormData {
  name: string;
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
    name: "",
    dob: "",
    school: "",
    email: "",
  });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const toast = useCustomToast();
  const { user, fetchUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null && !authLoading) {
      router.replace("/");
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (user) {
      setUserId(user.user_id);
      setFormData({
        name: user.full_name || "",
        dob: user.date_of_birth || "",
        school: user.educational_background || "",
        email: user.email || "",
      });
      setPhoto(user.profile_picture || "");
      setPreviousPhotoPath(user.profile_picture || null);
    }
  }, [user]);

  const handleEmailChange = async () => {
    setEmailLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Error", "No active session. Please sign in again.");
      setEmailLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast.error("Error", "Email update failed. Please try again.");
      setEmailLoading(false);
      return;
    }

    toast.success("Success", "Confirmation email sent successfully!");
    setShowEmailModal(false);
    setEmailLoading(false);
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

    const target = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
    if (target?.textContent !== "Update Profile") return;

    const errors = validate();
    setValidationErrors(errors);
    if (errors.length > 0 || !userId) return;

    const isNameChanged = formData.name !== (user?.full_name || "");
    const isDobChanged = formData.dob !== (user?.date_of_birth || "");
    const isSchoolChanged = formData.school !== (user?.educational_background || "");
    const isImageChanged = photo !== previousPhotoPath;

    if (!isNameChanged && !isDobChanged && !isSchoolChanged && !isImageChanged) {
      toast.info("No changes", "No changes detected to update.");
      return;
    }

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
          window.dispatchEvent(new Event("profileUpdated"));
        }
      }
    } catch (err: any) {
      toast.error("Error", "An error occurred during profile update.");
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = (uploadedImageUrl: string | null): Record<string, any> => {
    const payload: Record<string, any> = {};
    if (formData.name !== (user?.full_name || "") && formData.name.trim() !== "") {
      payload.full_name = formData.name;
    }
    if (formData.dob !== (user?.date_of_birth || "") && formData.dob.trim() !== "") {
      payload.date_of_birth = formData.dob;
    }
    if (
      formData.school !== (user?.educational_background || "") &&
      formData.school.trim() !== ""
    ) {
      payload.educational_background = formData.school;
    }
    payload.profile_picture = uploadedImageUrl;
    return payload;
  };

  const updateProfileState = (uploadedImageUrl: string | null) => {
    setPreviousPhotoPath(uploadedImageUrl);
    setPhoto(uploadedImageUrl || "");
    setFile(null);
    fetchUser();
  };

  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUser();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [fetchUser]);

  return (
    <div className="flex flex-col relative py-10 sm:mb-26 sm:py-28 mt-13 sm:mt-16 overflow-y-hidden">
      <BackgroundSVGs />
      {(loading || emailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
          <LoadingSpinner
            text={loading ? "Updating profile..." : "Updating email..."}
            size="md"
          />
        </div>
      )}
      <section
        className="
          flex-1 bg-transparent flex flex-col items-center justify-center px-4 md:px-0
          md:w-full md:max-w-6xl md:mx-auto
        "
      >
        <h2 className="text-[28px] md:text-[36px] font-medium text-center text-black mb-8 sm:mb-18">
          Profile
        </h2>
        <form
          onSubmit={handleSubmit}
          className="
            flex flex-col items-center w-full gap-6
            md:flex-row md:items-start md:justify-center md:gap-[119px]
          "
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
        emailLoading={emailLoading}
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
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPhoto(URL.createObjectURL(f));
    }
  };

  const handleRemovePhoto = () => {
    setPhoto("");
    setFile(null);
    setPreviousPhotoPath(null);
  };

  return (
    <div className="flex flex-col items-center">
      <img
        src={photo || "/img/defaultProfileImage.png"}
        alt="User Avatar"
        className="rounded-xl object-cover w-[343px] h-[343px] md:w-[358px] md:h-[358px] md:mx-0 border"
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
        className="text-[16px] font-bold mt-4 w-[175px] h-[48px] md:h-[60px]"
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
        onClick={handleRemovePhoto}
        className="text-[16px] font-bold mt-5 text-[var(--blue-500)] hover:underline"
      >
        Remove photo
      </button>
    </div>
  );
};

const ProfileFormSection = ({
  formData,
  handleInputChange,
  getFieldError,
  loading,
  setShowEmailModal,
}) => (
  <div
    className="
      w-full max-w-[453px] space-y-10
      md:w-[453px] md:max-w-[453px] md:ml-0
    "
  >
    {["name", "dob", "school"].map((field) => (
      <div key={field}>
        <Label htmlFor={field} className="mb-1 text-[16px] font-normal">
          {field === "dob"
            ? "Date of Birth"
            : field === "school"
            ? "Education Background"
            : "Name"}
        </Label>
        <Input
          id={field}
          type={field === "dob" ? "date" : "text"}
          value={formData[field]}
          onChange={handleInputChange(field)}
          className={`${getFieldError(field) ? "border-red-500" : ""} w-full h-[48px]`}
        />
        {getFieldError(field) && (
          <p className="text-red-500 text-xs mt-1">{getFieldError(field)}</p>
        )}
      </div>
    ))}
    <div>
      <Label htmlFor="email" className="mb-2 text-[16px] font-normal">Email</Label>
      <div className="flex gap-2 items-center">
        <Input
          id="email"
          type="email"
          value={formData.email}
          readOnly
          disabled
          className="bg-gray-100 cursor-not-allowed text-gray-500 w-full h-[48px]"
        />
        <ButtonT
          variant="ghost"
          className="!h-[48px] flex items-center justify-center whitespace-nowrap"
          onClick={() => setShowEmailModal(true)}
        >
          Change
        </ButtonT>
      </div>
    </div>
    <ButtonT
      variant="primary"
      className="w-full h-[48px]"
      type="submit"
    >
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
  emailLoading,
}) => {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [newEmailError, setNewEmailError] = useState<string | null>(null);
  const [confirmEmailError, setConfirmEmailError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const handleNewEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setNewEmail(email);
    if (showErrors) {
      setNewEmailError(validateNewEmail(email));
      if (confirmEmail && email !== confirmEmail) {
        setConfirmEmailError("Emails do not match.");
      } else {
        setConfirmEmailError(null);
      }
    }
  };

  const handleConfirmEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirm = e.target.value;
    setConfirmEmail(confirm);
    if (showErrors) {
      if (newEmail !== confirm) {
        setConfirmEmailError("Emails do not match.");
      } else {
        setConfirmEmailError(null);
      }
    }
  };

  const handleSendConfirmation = () => {
    setShowErrors(true);
    const emailErr = validateNewEmail(newEmail);
    setNewEmailError(emailErr);
    let confirmErr: string | null = null;
    if (!confirmEmail) {
      confirmErr = "Please confirm your new email.";
    } else if (newEmail !== confirmEmail) {
      confirmErr = "Emails do not match.";
    }
    setConfirmEmailError(confirmErr);

    if (emailErr || confirmErr) return;
    handleEmailChange();
  };

  React.useEffect(() => {
    if (!showEmailModal) {
      setShowErrors(false);
      setNewEmailError(null);
      setConfirmEmailError(null);
      setConfirmEmail("");
    }
  }, [showEmailModal]);

  return (
    <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Label htmlFor="new-email">New Email</Label>
          {emailLoading && (
            <div className="flex justify-center">
              <LoadingSpinner size="sm" text="" />
            </div>
          )}
          <Input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={handleNewEmailChange}
            className={showErrors && newEmailError ? "border-red-500" : ""}
            disabled={emailLoading}
            autoComplete="off"
          />
          {showErrors && newEmailError && (
            <p className="text-red-500 text-xs mt-1">{newEmailError}</p>
          )}
          <Label htmlFor="confirm-email">Confirm New Email</Label>
          <Input
            id="confirm-email"
            type="email"
            value={confirmEmail}
            onChange={handleConfirmEmailChange}
            className={showErrors && confirmEmailError ? "border-red-500" : ""}
            disabled={emailLoading}
            autoComplete="off"
          />
          {showErrors && confirmEmailError && (
            <p className="text-red-500 text-xs mt-1">{confirmEmailError}</p>
          )}
          <ButtonT
            onClick={handleSendConfirmation}
            className="w-full mt-2"
            disabled={emailLoading}
          >
            {emailLoading ? "Sending..." : "Send Confirmation"}
          </ButtonT>
        </div>
      </DialogContent>
    </Dialog>
  );
};
