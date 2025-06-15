import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomToast } from "@/components/ui/CustomToast";
import { supabase } from "@/lib/supabaseClient";
import { getBangkokISOString } from "@/lib/bangkokTime";

interface Course {
  id: string;
  name: string;
  price: number | null; 
  summary?: string;
  status: "active" | "inactive";
  image_url?: string | null;
  lessons_count?: number | null;
}

interface EditBundleData {
  name: string;
  price: string;
  description: string;
  detail: string;
  course_ids: string[];
}

export const useEditBundleForm = (bundleId: string) => {
  const router = useRouter();
  const { success, error: toastError } = useCustomToast();

  const [formData, setFormData] = useState<EditBundleData>({
    name: "",
    price: "",
    description: "",
    detail: "",
    course_ids: [],
  });

  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [bundleLoading, setBundleLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (bundleId && bundleId.trim()) {
      fetchBundleData();
    }
  }, [bundleId]);

const fetchCourses = async () => {
  try {
    setCoursesLoading(true);
    
    const response = await fetch("/api/admin/edit-bundle-courses", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      setAvailableCourses([]);
      toastError("No courses available", "Please create courses first before editing bundles");
      return;
    }

    setAvailableCourses(data);

  } catch (error) {
    console.error("Error fetching courses from API:", error);
    
    // Fallback: ใช้ Supabase โดยตรง
    try {
      const { data, error: supabaseError } = await supabase
        .from("courses")
        .select("id, name, price, summary, status, cover_image_url")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (supabaseError) {
        setAvailableCourses([]);
        toastError("Failed to load courses", "Please try again later");
        return;
      }

      if (!data || data.length === 0) {
        setAvailableCourses([]);
        toastError("No courses available", "Please create courses first before editing bundles");
        return;
      }

      const formattedCourses = data.map((course: any) => ({
        id: course.id,
        name: course.name,
        price: course.price || 0,
        summary: course.summary || "",
        status: course.status || "active",
        image_url: course.cover_image_url,
        lessons_count: 0,
      }));

      setAvailableCourses(formattedCourses);

    } catch (fallbackError) {
      setAvailableCourses([]);
      toastError("Failed to load courses", "Please try again later");
    }
  } finally {
    setCoursesLoading(false);
  }
};

const fetchBundleData = async () => {
  try {
    setBundleLoading(true);

    if (!bundleId || bundleId.trim() === '') {
      toastError("Invalid bundle ID", "Please check the URL and try again");
      router.push("/admin/dashboard/bundle");
      return;
    }

    // ดึง bundle พื้นฐานก่อน
    const { data: bundleData, error: bundleError } = await supabase
      .from('bundles')
      .select('*')
      .eq('id', bundleId)
      .single();

    if (bundleError) {
      if (bundleError.code === 'PGRST116') {
        toastError("Bundle not found", "The bundle you're looking for doesn't exist");
        router.push("/admin/dashboard/bundle");
        return;
      }
      throw bundleError;
    }

    if (!bundleData) {
      toastError("Bundle not found", "The bundle you're looking for doesn't exist");
      router.push("/admin/dashboard/bundle");
      return;
    }

    // ดึง course_ids
    const { data: bundleCourseIds, error: coursesError } = await supabase
      .from('bundle_courses')
      .select('course_id')
      .eq('bundle_id', bundleId);

    let bundleCourses = null;
    if (bundleCourseIds && bundleCourseIds.length > 0) {
      const courseIds = bundleCourseIds.map(bc => bc.course_id);
      
      // ดึงข้อมูล courses
      const { data: coursesData, error: coursesDataError } = await supabase
        .from('courses')
        .select('id, name, price, summary, status, cover_image_url')
        .in('id', courseIds);

      if (!coursesDataError) {
        bundleCourses = bundleCourseIds.map(bc => ({
          course_id: bc.course_id,
          courses: coursesData?.find(c => c.id === bc.course_id)
        })).filter(bc => bc.courses);
      }
    } else {
      bundleCourses = [];
    }

    // Set form data
    setFormData({
      name: bundleData.name || "",
      price: bundleData.price?.toString() || "",
      description: bundleData.description || "",
      detail: bundleData.detail || "",
      course_ids: bundleCourses?.map((bc: any) => bc.course_id) || [],
    });

    // Set selected courses
    const selectedCoursesData = bundleCourses
      ?.filter((bc: any) => bc.courses)
      ?.map((bc: any) => ({
        id: bc.courses.id,
        name: bc.courses.name,
        price: bc.courses.price || 0,
        summary: bc.courses.summary || "",
        status: bc.courses.status || "active",
        image_url: bc.courses.cover_image_url,
        lessons_count: 0,
      })) || [];

    setSelectedCourses(selectedCoursesData);

  } catch (error) {
    console.error("Error fetching bundle:", error);
    toastError("Failed to load bundle", "Please try again later");
    router.push("/admin/dashboard/bundle");
  } finally {
    setBundleLoading(false);
  }
};

  const handleInputChange = (field: keyof EditBundleData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddCourse = () => {
    if (availableCourses.length > 0) {
      const placeholderCourse: Course = {
        id: "",
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
      return;
    }

    const selectedCourse = availableCourses.find((c) => c.id === courseId);
    if (!selectedCourse) return;

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

      const validCourseIds = formData.course_ids.filter(id => id !== '');
      
      if (validCourseIds.length === 0) {
        toastError("Validation Error", "At least one course is required");
        return false;
      }

      setLoading(true);

      // 1. อัปเดต bundle basic info ผ่าน API
      const updateData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim(),
        detail: formData.detail.trim(),
      };

      const response = await fetch(`/api/admin/bundle-update/${bundleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API returned failure');
      }

      // 2. อัปเดต courses ผ่าน Supabase โดยตรง
      const bangkok = getBangkokISOString();

      // ลบ bundle_courses เก่า
      const { error: deleteError } = await supabase
        .from('bundle_courses')
        .delete()
        .eq('bundle_id', bundleId);

      if (deleteError) {
        throw new Error('Failed to delete old courses: ' + deleteError.message);
      }

      // เพิ่ม bundle_courses ใหม่
      if (validCourseIds.length > 0) {
        const bundleCoursesToInsert = validCourseIds.map(courseId => ({
          bundle_id: bundleId,
          course_id: courseId,
          created_at: bangkok
        }));

        const { error: insertError } = await supabase
          .from('bundle_courses')
          .insert(bundleCoursesToInsert);

        if (insertError) {
          throw new Error('Failed to add new courses: ' + insertError.message);
        }
      }

      success(
        "Bundle Updated Successfully", 
        "The bundle has been updated successfully."
      );

      // รอสักครู่ก่อน redirect
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push("/admin/dashboard/bundle");
      
      return true;
      
    } catch (error) {
      console.error("Bundle update error:", error);
      toastError(
        "Failed to update bundle",
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

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
    bundleLoading,
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