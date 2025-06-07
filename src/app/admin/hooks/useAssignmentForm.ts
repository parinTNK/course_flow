import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomToast } from "@/components/ui/CustomToast";
import { supabase } from "@/lib/supabaseClient";
import { getBangkokISOString } from "@/lib/bangkokTime";

interface AssignmentFormData {
  description: string;
  solution: string;
  courseId: string;
  lessonId: string;
  subLessonId: string;
}

export function useAssignmentForm(mode: "create" | "edit" = "create", assignmentId?: string) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useCustomToast();

  const [formData, setFormData] = useState<AssignmentFormData>({
    description: "",
    solution: "",
    courseId: "",
    lessonId: "",
    subLessonId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [subLessons, setSubLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase.from("courses").select("id, name");
      if (data) setCourses(data);
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!formData.courseId) return;
    const fetchLessons = async () => {
      const { data } = await supabase
        .from("lessons")
        .select("id, title")
        .eq("course_id", formData.courseId);
      if (data) setLessons(data);
    };
    fetchLessons();
  }, [formData.courseId]);

  useEffect(() => {
    if (!formData.lessonId) return;
    const fetchSubLessons = async () => {
      const { data } = await supabase
        .from("sub_lessons")
        .select("id, title")
        .eq("lesson_id", formData.lessonId);
      if (data) setSubLessons(data);
    };
    fetchSubLessons();
  }, [formData.lessonId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "description" && value.length >= 300) {
      setErrors((prev) => ({
        ...prev,
        description: "You've reached the 300 character limit.",
      }));
    } else if (name === "solution" && value.length >= 500) {
      setErrors((prev) => ({
        ...prev,
        solution: "You've reached the 500 character limit.",
      }));
    } else {

      setErrors((prev) => ({
        ...prev,
        [name]: prev[name] === "You've reached the 300 character limit." ||
                prev[name] === "You've reached the 500 character limit."
          ? ""
          : prev[name],
      }));
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (field: keyof AssignmentFormData, value: string) => {
    if (field === "courseId") {
      setFormData((prev) => ({
        ...prev,
        courseId: value,
        lessonId: "",
        subLessonId: "",
      }));
    } else if (field === "lessonId") {
      setFormData((prev) => ({
        ...prev,
        lessonId: value,
        subLessonId: "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleCancel = () => {
    router.push("/admin/dashboard/assignments");
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.courseId) newErrors.courseId = "Please select course";
    if (!formData.lessonId) newErrors.lessonId = "Please select lesson";
    if (!formData.subLessonId) newErrors.subLessonId = "Please select sub-lesson";

    if (formData.description.trim().length < 5) {
    newErrors.description = "Assignment must be at least 5 characters";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Please enter assignment";
    } else if (formData.description.length > 300) {
      newErrors.description = "Assignment is too long (max 300 characters)";
    }

    if (!formData.solution.trim()) {
      newErrors.solution = "Please enter solution";
    } else if (formData.solution.length > 500) {
      newErrors.solution = "Solution is too long (max 500 characters)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toastError("Please fill all required fields");
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      if (mode === "create") {
        const { data: existing } = await supabase
          .from("assignments")
          .select("id")
          .eq("sub_lesson_id", formData.subLessonId);

        if (existing && existing.length > 0) {
          toastError("This sub-lesson already has an assignment.");
          setIsLoading(false);
          return;
        }
      }

      const now = getBangkokISOString();

      const { error } = await supabase.from("assignments").insert({
        description: formData.description.trim(),
        solution: formData.solution.trim(),
        course_id: formData.courseId,
        lesson_id: formData.lessonId,
        sub_lesson_id: formData.subLessonId,
        created_at: now,
        updated_at: now,
      });

      if (error) throw error;

      toastSuccess("Assignment created successfully!");
      router.push("/admin/dashboard/assignments");
    } catch (err: any) {
      toastError("Failed to create assignment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!assignmentId) return;

    const newErrors: Record<string, string> = {};

    if (!formData.courseId) newErrors.courseId = "Please select course";
    if (!formData.lessonId) newErrors.lessonId = "Please select lesson";
    if (!formData.subLessonId) newErrors.subLessonId = "Please select sub-lesson";

    if (!formData.description.trim()) {
      newErrors.description = "Please enter assignment";
    } else if (formData.description.length < 5) {
      newErrors.description = "Minimum 5 characters required";
    } else if (formData.description.length > 300) {
      newErrors.description = "Too long (max 300 characters)";
    }

    if (!formData.solution.trim()) {
      newErrors.solution = "Please enter solution";
    } else if (formData.solution.length > 500) {
      newErrors.solution = "Too long (max 500 characters)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toastError("Please fix the errors in the form.");
      return;
    }

    setErrors({});
    setIsLoading(true);

    const updated_at = getBangkokISOString();

    const { error } = await supabase
      .from("assignments")
      .update({
        description: formData.description.trim(),
        solution: formData.solution.trim(),
        course_id: formData.courseId,
        lesson_id: formData.lessonId,
        sub_lesson_id: formData.subLessonId,
        updated_at,
      })
      .eq("id", assignmentId);

    if (error) {
      toastError("Failed to update assignment.");
    } else {
      toastSuccess("Assignment updated successfully!");
      router.push("/admin/dashboard/assignments");
    }

    setIsLoading(false);
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentId) return;
    
    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      toastError("Failed to delete assignment.");
      return;
    }

    toastSuccess("Assignment deleted successfully!");
    router.push("/admin/dashboard/assignments");
  };


  return {
    formData,
    setFormData,
    courses,
    lessons,
    subLessons,
    errors,
    isLoading,
    handleInputChange,
    handleSelect,
    handleCancel,
    handleSubmit,
    handleUpdate,
    handleDeleteAssignment,
  };
}
