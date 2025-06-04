import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomToast } from "@/components/ui/CustomToast";
import {ALL_COURSES_ID, DISCOUNT_TYPE_PERCENT, PromoCodeFormData} from "@/types/promoCode";
import axios from "axios";

export function usePromoCodeForm({ mode, id }: { mode: "create" | "edit"; id?: string }) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useCustomToast();

  const [formData, setFormData] = useState<PromoCodeFormData>({
    code: "",
    min_purchase_amount: "",
    discount_type: "",
    discount_value: "",
    course_ids: [ALL_COURSES_ID],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [popoverOpen, setPopoverOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [triggerWidth, setTriggerWidth] = useState<number>(0);


  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const res = await axios.get(`/api/promocodes/${id}`);
        const promo = res.data;
        console.log("Fetched promo code:", promo);
        setFormData({
          code: promo.code || "",
          min_purchase_amount: promo.min_purchase_amount?.toString() || "",
          discount_type: promo.discount_type || "",
          discount_value: promo.discount_value?.toString() || "",
          course_ids:
            promo.is_all_courses || !promo.course_ids?.length
              ? [ALL_COURSES_ID]
              : promo.course_ids,
        });
      } catch (e: any) {
        toastError("Failed to load promo code");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchPromo();

  }, [id]);

  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [popoverOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setErrors((prev) => {
      if (!prev[name]) return prev;
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

  const handleCoursesBlur = () => {
    if (!formData.course_ids || formData.course_ids.length === 0) {
      setFormData((prev) => ({
        ...prev,
        course_ids: [ALL_COURSES_ID],
      }));
    }
  };

  const handlePercentBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (formData.discount_type === DISCOUNT_TYPE_PERCENT) {
      let value = Number(e.target.value);
      if (value > 100) {
        setFormData((prev) => ({
          ...prev,
          discount_value: "100",
        }));
      } else if (value < 0) {
        setFormData((prev) => ({
          ...prev,
          discount_value: "0",
        }));
      }
    }
  };

  const handleCancel = () => {
    router.back();
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
      formData.discount_type === DISCOUNT_TYPE_PERCENT &&
      Number(formData.discount_value) > 100
    ) {
      newErrors.discount_value = "Percent must not exceed 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const isValid = validatePromoCodeForm();
    if (!isValid) {
      setIsLoading(false);
      return;
    }

    const isAllCourses = formData.course_ids.includes(ALL_COURSES_ID);
    const payload: any = {
      code: formData.code.trim(),
      min_purchase_amount: Number(formData.min_purchase_amount) || 0,
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value) || 0,
      is_all_courses: isAllCourses,
    };

    if (!isAllCourses) {
      payload.course_ids = formData.course_ids;
    }

    try {
      if (mode === "edit" && id) {
        await axios.put(`/api/promocodes/${id}`, payload);
        toastSuccess("Promo code updated successfully!");
      } else {
        await axios.post("/api/promocodes/create", payload);
        toastSuccess("Promo code created successfully!");
      }
      router.back();
    } catch (err: any) {
      setIsLoading(false);
      const backendMsg =
        err?.response?.data?.error || err.message || "Unknown error";
      toastError(
        `Unable to create promo code, please try again ${
          backendMsg ? `\nDetails: ${backendMsg}` : ""
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePromoCode = async () => {
  if (!id) return;
  console.log("Deleting promo code with ID:", id);
  try {
    await axios.delete(`/api/promocodes/${id}`);
    toastSuccess("Promo code deleted successfully");
    router.push("/admin/dashboard/promo-codes");
  } catch (e: any) {
    toastError(e.message || "Failed to delete promo code");
  }
};

  return {
    formData,
    setFormData,
    isLoading,
    errors,
    popoverOpen,
    setPopoverOpen,
    triggerRef,
    triggerWidth,

    handleInputChange,
    handleDiscountTypeChange,
    handleCoursesBlur,
    handlePercentBlur,
    handleCancel,
    handleSubmit,
    handleDeletePromoCode
  };
}
