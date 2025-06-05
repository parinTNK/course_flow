import { useState, useEffect, useCallback, useMemo } from "react";
import type { Course } from "@/types/promoCode";
import { ALL_COURSES_ID } from "@/types/promoCode"
import { useCustomToast } from "@/components/ui/CustomToast";
import axios from "axios";


export function useCoursesSelect(
  selectedIds: string[],
  setSelectedIds: (ids: string[]) => void,
  min_purchase: string,
) {
  const { success: toastSuccess, error: toastError } = useCustomToast();
  
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const res = await axios.get("/api/course");
        setCoursesList([
          { id: ALL_COURSES_ID, name: "All Courses" },
          ...(res.data || []),
        ]);
      } catch (err) {
        setCoursesList([{ id: ALL_COURSES_ID, name: "All Courses" }]);
        toastError("Failed to fetch courses. Please try again");
      }finally {
        setIsLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  const handleToggleCourse = useCallback(
    (courseId: string) => {
      let newIds: string[] = [];
      if (courseId === ALL_COURSES_ID) {
        newIds = [ALL_COURSES_ID];
      } else {
        const currentIds = selectedIds.filter((id) => id !== ALL_COURSES_ID);
        if (selectedIds.includes(courseId)) {
          newIds = currentIds.filter((id) => id !== courseId);
        } else {
          newIds = [...currentIds, courseId];
        }
        if (newIds.length === 0) {
          newIds = [ALL_COURSES_ID];
        }
      }
      setSelectedIds(newIds);
    },
    [selectedIds, setSelectedIds]
  );

  const handleRemoveTag = useCallback(
    (id: string) => {
      const newIds = selectedIds.filter((cid) => cid !== id);
      setSelectedIds(newIds.length === 0 ? [ALL_COURSES_ID] : newIds);
    },
    [selectedIds, setSelectedIds]
  );

  const minPurchase = Number(min_purchase) || 0;

const filteredCoursesList = useMemo(() => {
  return coursesList
    .filter((course) => (
      course.id === ALL_COURSES_ID ||
      (Number(course.price) >= minPurchase)
    ))
    .sort((a, b) => {
      if (a.id === ALL_COURSES_ID) return -1;
      if (b.id === ALL_COURSES_ID) return 1;
      const priceA = Number(a.price ?? Infinity);
      const priceB = Number(b.price ?? Infinity);
      return priceA - priceB;
    });
}, [coursesList, minPurchase]);

  const getSelectedCoursesDisplay = useMemo(() => {
    return filteredCoursesList.filter((c) => selectedIds?.includes(c.id));
  }, [selectedIds, filteredCoursesList]);

  console.log("getSelectedDisplay:", getSelectedCoursesDisplay);
  return {
    coursesList,
    filteredCoursesList,
    error,
    isLoadingCourses,
    handleToggleCourse,
    handleRemoveTag,
    getSelectedCoursesDisplay,
  };
}
