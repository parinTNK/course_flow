import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomToast } from "@/components/ui/CustomToast";
import { supabase } from "@/lib/supabaseClient";
import { getBangkokISOString } from "@/lib/bangkokTime";

interface Course {
  id: string;
  name: string;
  price: number;
  summary?: string;
  status: "active" | "inactive";
}

interface CreateBundleData {
  name: string;
  price: string;
  description: string;
  detail: string;
  course_ids: string[];
}

export const useBundleForm = () => {
  const router = useRouter();
  const { success, error: toastError } = useCustomToast();

  // Form state
  const [formData, setFormData] = useState<CreateBundleData>({
    name: "",
    price: "",
    description: "",
    detail: "",
    course_ids: [],
  });

  // Available courses and selected courses
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Fetch available courses
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);

      const response = await fetch("/api/course");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch courses`);
      }

      const data = await response.json();
      console.log("Fetched courses data:", data);

      const formattedCourses = data.map((course: any) => ({
        id: course.id,
        name: course.name,
        price: course.price || 0,
        summary: course.summary || "",
        status: course.status || "active",
      }));

      setAvailableCourses(formattedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toastError("Failed to load courses", "Please try again later");
      setAvailableCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateBundleData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddCourse = () => {
    if (availableCourses.length > 0) {
      const placeholderCourse = {
        id: "", // empty id สำหรับ placeholder
        name: "Place Holder",
        price: 0,
        summary: "",
        status: "active" as const,
      };

      setSelectedCourses((prev) => [...prev, placeholderCourse]);
      setFormData((prev) => ({
        ...prev,
        course_ids: [...prev.course_ids, ""],
      }));
    }
  };

  const handleCourseSelect = (index: number, courseId: string) => {
    if (courseId === "") {
      // ถ้าเลือก placeholder ไม่ต้องทำอะไร
      return;
    }

    const selectedCourse = availableCourses.find((c) => c.id === courseId);
    if (!selectedCourse) return;

    // ตรวจสอบว่า course นี้ถูกเลือกแล้วหรือไม่ (ยกเว้น index ปัจจุบัน)
    const isDuplicate = formData.course_ids.some(
      (id, i) => id === courseId && i !== index
    );

    if (isDuplicate) {
      toastError("Duplicate course", "This course is already selected");
      return;
    }

    const newSelectedCourses = [...selectedCourses];
    newSelectedCourses[index] = selectedCourse;
    setSelectedCourses(newSelectedCourses);

    const newCourseIds = [...formData.course_ids];
    newCourseIds[index] = courseId;
    setFormData((prev) => ({
      ...prev,
      course_ids: newCourseIds,
    }));
  };

  const handleDeleteCourse = (index: number) => {
    const newSelectedCourses = selectedCourses.filter((_, i) => i !== index);
    const newCourseIds = formData.course_ids.filter((_, i) => i !== index);

    setSelectedCourses(newSelectedCourses);
    setFormData((prev) => ({
      ...prev,
      course_ids: newCourseIds,
    }));
  };

  const handleCancel = () => {
    router.push("/admin/dashboard/bundle");
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.name.trim()) {
        toastError("Validation Error", "Bundle name is required");
        return false;
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        toastError("Validation Error", "Valid price is required");
        return false;
      }

      // กรองเฉพาะ course IDs ที่ไม่ใช่ empty string
      const validCourseIds = formData.course_ids.filter((id) => id !== "");

      if (validCourseIds.length === 0) {
        toastError("Validation Error", "At least one course is required");
        return false;
      }

      setLoading(true);

      const bangkok = getBangkokISOString();

      // 1. สร้าง bundle ก่อน
      const { data: bundleData, error: bundleError } = await supabase
        .from("bundles")
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          detail: formData.detail.trim(),
          price: parseFloat(formData.price),
          status: "active",
          created_at: bangkok,
          updated_at: bangkok,
        })
        .select()
        .single();

      if (bundleError) {
        console.error("❌ Error creating bundle:", bundleError);
        throw new Error(bundleError.message);
      }

      console.log("✅ Bundle created:", bundleData);
      const bundleId = bundleData.id;

      // 2. เพิ่ม courses เข้า bundle ผ่าน bundle_courses table
      if (validCourseIds.length > 0) {
        const bundleCoursesToInsert = validCourseIds.map((courseId) => ({
          bundle_id: bundleId,
          course_id: courseId,
          created_at: bangkok,
        }));

        const { error: bundleCoursesError } = await supabase
          .from("bundle_courses")
          .insert(bundleCoursesToInsert);

        if (bundleCoursesError) {
          console.error("❌ Error adding courses:", bundleCoursesError);

          // ลบ bundle ที่สร้างไว้ก่อนหน้า
          await supabase.from("bundles").delete().eq("id", bundleId);

          if (bundleCoursesError.code === "23503") {
            throw new Error("One or more courses not found");
          }
          throw new Error("Failed to add courses to bundle");
        }

        console.log("✅ Courses added to bundle successfully");
      }

      success(
        "Bundle Created Successfully",
        "The bundle has been created and is now available."
      );

      // Navigate back to bundles list
      router.push("/admin/dashboard/bundle");
      return true;
    } catch (error) {
      console.error("Error creating bundle:", error);
      toastError(
        "Failed to create bundle",
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // เพิ่ม function สำหรับดู courses ที่ยังเลือกได้
  const getAvailableCoursesForSelection = (currentIndex?: number) => {
    return availableCourses.filter((course) => {
      const isAlreadySelected = formData.course_ids.some(
        (id, index) => id === course.id && index !== currentIndex
      );
      return !isAlreadySelected;
    });
  };

  const canAddMoreCourses = () => {
    return availableCourses.length > 0;
  };

  return {
    formData,
    availableCourses,
    selectedCourses,
    loading,
    coursesLoading,
    handleInputChange,
    handleAddCourse,
    handleCourseSelect,
    handleDeleteCourse,
    handleCancel,
    handleSubmit,
    getAvailableCoursesForSelection,
    canAddMoreCourses,
  };
};
