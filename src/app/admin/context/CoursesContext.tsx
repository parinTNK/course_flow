"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Course } from "../types";
import ConfirmationModal from "@/app/admin/components/ConfirmationModal";
import { useCustomToast } from "@/components/ui/CustomToast";

interface PaginationData {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

interface CoursesContextType {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleDeleteCourse: (id: string) => void;
  fetchCourses: () => Promise<void>;
  currentPage: number;
  totalPages: number;
  coursesPerPage: number;
  setCurrentPage: (page: number) => void;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export const CoursesProvider = ({ children }: { children: ReactNode }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });
  const coursesPerPage = 8;

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: coursesPerPage.toString(),
        search: searchTerm,
      });

      const response = await fetch(
        `/api/courses-list?${queryParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to fetch courses: ${response.statusText}`
        );
      }

      const data = await response.json();
      setCourses(data.courses);
      setPagination(data.pagination);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching courses:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, coursesPerPage, searchTerm]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDeleteCourse = useCallback((id: string) => {
    setCourseToDelete(id);
    setIsConfirmOpen(true);
  }, []);

  const { success, error: toastError } = useCustomToast();

  const confirmDeleteCourse = useCallback(async () => {
    if (!courseToDelete) return;

    try {
      const response = await fetch(
        `/api/admin/courses-delete/${courseToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete course");
      }

      success(
        "Course deleted successfully",
        "The course has been removed from the system."
      );
      fetchCourses();
    } catch (err) {
      toastError("An error occurred", "Unable to delete the course.");
      console.error("Error deleting course:", err);
    } finally {
      setIsConfirmOpen(false);
      setCourseToDelete(null);
    }
  }, [courseToDelete, fetchCourses]);

  const contextValue = useMemo(
    () => ({
      courses,
      filteredCourses: courses,
      isLoading,
      error,
      searchTerm,
      setSearchTerm,
      handleDeleteCourse,
      fetchCourses,
      currentPage,
      totalPages: pagination.totalPages,
      coursesPerPage,
      setCurrentPage,
    }),
    [
      courses,
      isLoading,
      error,
      searchTerm,
      handleDeleteCourse,
      fetchCourses,
      currentPage,
      pagination.totalPages,
      coursesPerPage,
    ]
  );

  return (
    <CoursesContext.Provider value={contextValue}>
      {children}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setCourseToDelete(null);
        }}
        onConfirm={confirmDeleteCourse}
        title="Delete Course"
        message="Are you sure you want to delete this course?"
        confirmText="Yes, I want to delete the course"
        cancelText="No, keep it"
      />
    </CoursesContext.Provider>
  );
};

export const useCoursesContext = () => {
  const context = useContext(CoursesContext);
  if (!context) {
    throw new Error("useCoursesContext must be used within a CoursesProvider");
  }
  return context;
};
