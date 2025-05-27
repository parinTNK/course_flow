"use client";

import React, { useState } from "react";
import PromoCodeFormView from "../../components/PromoCodeFormView";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useCustomToast } from "@/components/ui/CustomToast";

function CreatePromoCode() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { success: toastSuccess, error: toastError } = useCustomToast();
  // State สำหรับฟอร์ม
  const [formData, setFormData] = useState({
    code: "",
    min_purchase_amount: "",
    discount_type: "",
    discount_value: "",
    course_ids: ["all"],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setErrors((prev) => {
      if (!prev[name]) return prev; // ไม่มี error เดิม ไม่ต้อง set ใหม่
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });

    if (name === "code") {
      const filtered = value.replace(/[^a-zA-Z0-9]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: filtered,
      }));
      return;
    }

    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDiscountTypeChange = (type: string) => {
    setErrors((prev) => {
      if (!prev.discount_type) return prev;
      const newErrors = { ...prev };
      delete newErrors.discount_type;
      return newErrors;
    });

    setFormData((prev) => ({
      ...prev,
      discount_type: type,
      discount_value: "",
    }));
  };

  const handleCoursesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      course_ids: [e.target.value],
    }));
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const isValid = validatePromoCodeForm();
    if (!isValid) return;

    const isAllCourses = formData.course_ids.includes("all"); // check all course is all course = true
    const payload: any = {
      code: formData.code.trim(),
      min_purchase_amount: Number(formData.min_purchase_amount) || 0,
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value) || 0,
      is_all_courses: isAllCourses,
    };

    if (!isAllCourses) {
      payload.course_ids = formData.course_ids; // if false, add course_ids to payload
    }

    try {
      const res = await axios.post("/api/promocodes/create", payload);
      setIsLoading(false);
      toastSuccess("Promo code created successfully!");
    } catch (err: any) {
      setIsLoading(false);
      toastError(err?.response?.data?.error || err.message || "Unknown error");
    }
  };

  const validatePromoCodeForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "Please fill out this field";
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.code)) {
      newErrors.code = "Promo code must be alphabet and number only";
    }

    if (!formData.min_purchase_amount.trim()) {
      newErrors.min_purchase_amount = "Please fill out this field";
    } else if (
      isNaN(Number(formData.min_purchase_amount)) ||
      Number(formData.min_purchase_amount) < 0
    ) {
      newErrors.min_purchase_amount = "Please enter a valid amount";
    }

    if (!formData.discount_type.trim()) {
      newErrors.discount_type = "Please select discount type";
    }

    if (!formData.discount_value.trim()) {
      newErrors.discount_value = "Please fill out this field";
    } else if (
      isNaN(Number(formData.discount_value)) ||
      Number(formData.discount_value) < 0
    ) {
      newErrors.discount_value = "Please enter a valid discount";
    } else if (
      formData.discount_type === "Percent" &&
      Number(formData.discount_value) > 100
    ) {
      newErrors.discount_value = "Percent must not exceed 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  console.log("formData:", formData);

  return (
    <div className="bg-gray-100 flex-1 pb-10">
      <PromoCodeFormView
        formData={formData}
        setFormData={setFormData} // เพิ่มบรรทัดนี้
        isLoading={isLoading}
        handleInputChange={handleInputChange}
        handleDiscountTypeChange={handleDiscountTypeChange}
        handleCoursesChange={handleCoursesChange}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
        errors={errors}
      />
    </div>
  );
}

export default CreatePromoCode;
