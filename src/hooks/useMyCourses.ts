import { useState, useEffect } from "react";
import axios from "axios";
import type { Course } from "@/types/Course";

export function useMyCourses(
  userId: string | undefined,
  tab: string,
  currentPage: number,
  limit: number
) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [allCoursesCount, setAllCoursesCount] = useState(0);
  const [inprogressCount, setInprogressCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setCourses([]);
      return;
    }

    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `/api/users/${userId}/courses?page=${currentPage}&limit=${limit}&tab=${tab}`
        );
        setCourses(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setAllCoursesCount(res.data.pagination.allCount || 0);
        setInprogressCount(res.data.pagination.inprogressCount || 0);
        setCompletedCount(res.data.pagination.completedCount || 0);
      } catch (err: any) {
        setError(err.message || "Failed to fetch courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [userId, currentPage, limit, tab]);

  return {
    courses,
    loading,
    error,
    totalPages,
    allCoursesCount,
    inprogressCount,
    completedCount,
  };
}
