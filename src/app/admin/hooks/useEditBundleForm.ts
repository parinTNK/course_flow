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
    console.log("📚 Fetching courses from API...");

    const response = await fetch("/api/course");
    
    if (!response.ok) {
      console.error("❌ API response not ok:", response.status);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Courses fetched from API:", data?.length || 0);

    if (!data || data.length === 0) {
      console.log("⚠️ No courses found");
      setAvailableCourses([]);
      toastError("No courses available", "Please create courses first before editing bundles");
      return;
    }

    // Format courses จาก API response
    const formattedCourses = data.map((course: any) => ({
      id: course.id,
      name: course.name,
      price: course.price || 0,
      summary: "", 
      status: "active", 
      image_url: null,
      lessons_count: null,
    }));

    setAvailableCourses(formattedCourses);
    console.log("✅ Courses formatted and set:", formattedCourses.length);

  } catch (error) {
    console.error("💥 Error fetching courses from API:", error);
    
    // Fallback: ลองดึงจาก Supabase โดยตรง
    console.log("🔄 Trying Supabase fallback...");
    try {
      const { data, error: supabaseError } = await supabase
        .from("courses")
        .select("id, name, price, image_url, lessons_count, status")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (supabaseError) {
        console.error("❌ Supabase fallback error:", supabaseError);
        setAvailableCourses([]);
        return;
      }

      if (!data || data.length === 0) {
        console.log("⚠️ No courses in Supabase either");
        setAvailableCourses([]);
        return;
      }

      const formattedCourses = data.map((course: any) => ({
        id: course.id,
        name: course.name,
        price: course.price || 0,
        summary: "",
        status: course.status || "active",
        image_url: course.image_url,
        lessons_count: course.lessons_count,
      }));

      setAvailableCourses(formattedCourses);
      console.log("✅ Supabase fallback successful:", formattedCourses.length);

    } catch (fallbackError) {
      console.error("💥 Supabase fallback also failed:", fallbackError);
      setAvailableCourses([]);
    }
  } finally {
    setCoursesLoading(false);
  }
};

  const fetchBundleData = async () => {
    try {
      setBundleLoading(true);
      console.log("🔍 Fetching bundle data for ID:", bundleId);

      if (!bundleId || bundleId.trim() === '') {
        console.error("❌ Invalid bundle ID:", bundleId);
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
        console.error("❌ Bundle fetch error:", bundleError);
        if (bundleError.code === 'PGRST116') {
          toastError("Bundle not found", "The bundle you're looking for doesn't exist");
          router.push("/admin/dashboard/bundle");
          return;
        }
        throw bundleError;
      }

      if (!bundleData) {
        console.error("❌ No bundle data returned");
        toastError("Bundle not found", "The bundle you're looking for doesn't exist");
        router.push("/admin/dashboard/bundle");
        return;
      }

      console.log("✅ Bundle data fetched:", bundleData);

      // ดึง bundle_courses แยก
      const { data: bundleCourses, error: coursesError } = await supabase
        .from('bundle_courses')
        .select(`
          course_id,
          courses (
            id,
            name,
            price,
            image_url,
            lessons_count,
            status
          )
        `)
        .eq('bundle_id', bundleId);

      if (coursesError) {
        console.error("⚠️ Bundle courses fetch error:", coursesError);
        // ไม่ throw error เพราะ bundle อาจไม่มี courses
      }

      console.log("📚 Bundle courses fetched:", bundleCourses?.length || 0);

      // Set form data
      setFormData({
        name: bundleData.name || "",
        price: bundleData.price?.toString() || "",
        description: bundleData.description || "",
        detail: bundleData.detail || "",
        course_ids: bundleCourses?.map((bc: any) => bc.course_id) || [],
      });

      // Set selected courses - แก้ไขการจัดการ price
      const selectedCoursesData = bundleCourses
        ?.filter((bc: any) => bc.courses)
        ?.map((bc: any) => ({
          id: bc.courses.id,
          name: bc.courses.name,
          price: bc.courses.price || 0,
          summary: "",
          status: bc.courses.status || "active",
          image_url: bc.courses.image_url,
          lessons_count: bc.courses.lessons_count,
        })) || [];

      setSelectedCourses(selectedCoursesData);
      console.log("✅ Form data set successfully");

    } catch (error) {
      console.error("💥 Error fetching bundle:", error);
      toastError("Failed to load bundle", "Please try again later");
      router.push("/admin/dashboard/bundle");
    } finally {
      setBundleLoading(false);
    }
  };

  const handleInputChange = (field: keyof EditBundleData, value: string) => {
    console.log(`📝 Input changed: ${field} = ${value}`);
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
      console.log("➕ Course placeholder added");
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

    console.log(`📚 Course selected: ${selectedCourse.name}`);
  };

  const handleDeleteCourse = (index: number) => {
    const newSelectedCourses = selectedCourses.filter((_, i) => i !== index);
    const newCourseIds = formData.course_ids.filter((_, i) => i !== index);

    setSelectedCourses(newSelectedCourses);
    setFormData((prev) => ({
      ...prev,
      course_ids: newCourseIds,
    }));

    console.log(`🗑️ Course removed at index: ${index}`);
  };

  const handleCancel = () => {
    console.log("❌ Edit cancelled");
    router.push("/admin/dashboard/bundle");
  };

  // Update ผ่าน API route
  const handleSubmit = async () => {
    try {
      console.log("🚀 Starting bundle update via API...");
      console.log("🎯 Bundle ID:", bundleId);
      console.log("📋 Form data:", formData);
      
      // Validation
      if (!formData.name.trim()) {
        console.error("❌ Validation failed: Bundle name is empty");
        toastError("Validation Error", "Bundle name is required");
        return false;
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        console.error("❌ Validation failed: Invalid price");
        toastError("Validation Error", "Valid price is required");
        return false;
      }

      const validCourseIds = formData.course_ids.filter(id => id !== '');
      console.log("📚 Valid course IDs:", validCourseIds);
      
      if (validCourseIds.length === 0) {
        console.error("❌ Validation failed: No courses selected");
        toastError("Validation Error", "At least one course is required");
        return false;
      }

      console.log("✅ All validations passed");
      setLoading(true);

      // 1. อัปเดต bundle basic info ผ่าน API
      console.log("1️⃣ Updating bundle basic info via API...");
      const updateData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim(),
        detail: formData.detail.trim(),
      };

      console.log("📤 Sending to API:", updateData);

      const response = await fetch(`/api/admin/bundle-update/${bundleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log("📡 API response status:", response.status);
      console.log("📡 API response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API Error:", errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ API response:", result);

      if (!result.success) {
        throw new Error(result.error || 'API returned failure');
      }

      console.log("✅ Bundle basic info updated via API");

      // 2. อัปเดต courses ผ่าน Supabase โดยตรง
      console.log("2️⃣ Updating bundle courses via Supabase...");
      
      const bangkok = getBangkokISOString();

      // ลบ bundle_courses เก่า
      const { error: deleteError } = await supabase
        .from('bundle_courses')
        .delete()
        .eq('bundle_id', bundleId);

      if (deleteError) {
        console.error("❌ Error deleting old courses:", deleteError);
        throw new Error('Failed to delete old courses: ' + deleteError.message);
      }

      console.log("✅ Old courses deleted");

      // เพิ่ม bundle_courses ใหม่
      if (validCourseIds.length > 0) {
        const bundleCoursesToInsert = validCourseIds.map(courseId => ({
          bundle_id: bundleId,
          course_id: courseId,
          created_at: bangkok
        }));

        console.log("📤 Inserting new courses:", bundleCoursesToInsert);

        const { error: insertError } = await supabase
          .from('bundle_courses')
          .insert(bundleCoursesToInsert);

        if (insertError) {
          console.error("❌ Error adding new courses:", insertError);
          throw new Error('Failed to add new courses: ' + insertError.message);
        }

        console.log("✅ New courses added");
      }

      console.log("🎉 Bundle update completed successfully!");

      success(
        "Bundle Updated Successfully", 
        "The bundle has been updated successfully."
      );

      // รอสักครู่ก่อน redirect
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("🔄 Redirecting to bundle list...");
      router.push("/admin/dashboard/bundle");
      
      return true;
      
    } catch (error) {
      console.error("💥 Bundle update error:", error);
      toastError(
        "Failed to update bundle",
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      return false;
    } finally {
      console.log("🔚 Update process finished");
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