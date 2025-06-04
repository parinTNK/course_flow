// hooks/useCourse.ts
import { useState, useEffect } from "react";
import axios from "axios";
import { Course } from "@/types/payment";

export function useCourse(courseId: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/course/${courseId}`)
      .then((res) => setCourse(res.data))
      .catch((err) =>
        setError(
          err.response?.data?.error || err.message || "Failed to fetch course"
        )
      )
      .finally(() => setLoading(false));
  }, [courseId]);

  console.log("useCourse", course);

  return { course, loading, error };
}
