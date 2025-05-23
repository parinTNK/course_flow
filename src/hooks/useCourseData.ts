import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Course, CourseSummary, Lesson } from "@/types/Course";

export function useCourseData(courseId: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Lesson[]>([]);
  const [otherCourses, setOtherCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!courseId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // ดึงข้อมูล course
        const { data: courseData } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();

        if (courseData) setCourse(courseData);

        // ดึง modules + sub-lessons
        const { data: lessonData } = await supabase
          .from("lessons")
          .select("id, title, order_no, sub_lessons(id, title)")
          .eq("course_id", courseId)
          .order("order_no", { ascending: true });

        if (lessonData) setModules(lessonData as Lesson[]);

        // ดึงคอร์สอื่น ๆ
        const { data: otherCourseData } = await supabase
          .from("courses")
          .select("id, name, summary, cover_image_url, total_learning_time, lessons(id)")
          .neq("id", courseId)
          .eq("status", "published");

        if (otherCourseData) {
          setOtherCourses(otherCourseData);
        }
      } catch (err) {
        console.error("Error in useCourseData:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  return { course, modules, otherCourses, loading };
}
