"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import CourseCard from "@/components/CourseCard";
import { Course } from "@/types/Course";
import CallToAction from "@/components/landing/CallToAction";
import Pagination from "@/app/admin/components/Pagination";
import BackgroundSVGs from "@/components/BackgroundSVGs";
import LoadingSpinner from "@/app/admin/components/LoadingSpinner";
import { Search } from "lucide-react";

const limit = 12;

const fetchCoursesData = async (
  page: number,
  search: string,
  setCourses: (courses: Course[]) => void,
  setTotalPages: (pages: number) => void,
  setError: (err: string | null) => void,
  setLoading: (loading: boolean) => void
) => {
  setLoading(true);
  setError(null);
  try {
    const res = await axios.get("/api/courses-our-courses", {
      params: { page, limit, search, status: "published" },
    });
    const data = res.data;
    setCourses(data.courses || []);
    setTotalPages(data.pagination?.totalPages || 1);
  } catch (err: any) {
    setError(
      err?.response?.data?.error || err.message || "Failed to fetch courses."
    );
  } finally {
    setLoading(false);
  }
};

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const SEARCH_PLACEHOLDER = "Search...";
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    fetchCoursesData(
      page,
      search,
      setCourses,
      setTotalPages,
      setError,
      setLoading
    );
  }, [page, search]);

  return (
    <div className="min-h-screen flex flex-col bg-transparent overflow-x-hidden">
      <BackgroundSVGs />
      <main className="flex-1 pt-24 pb-10">
        <div className="text-center max-w-4xl mx-auto py-10">
          <h1 className="text-3xl md:text-4xl font-medium sm:mt-10 mb-10 sm:mb-15">
            Our Courses
          </h1>
          <div className="mt-6 mx-auto w-[343px] md:w-[357px]">
            <div className="flex items-center w-full rounded-lg border border-gray-300 px-4 py-2 bg-white shadow sm:mb-14">
              <Search className="w-5 h-5 text-gray-500 mr-2" />
              <input
                type="text"
                placeholder={isInputFocused ? "" : SEARCH_PLACEHOLDER}
                className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent h-[30px]"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-10 w-full overflow-x-hidden pb-10">
          {loading ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-20">
              <LoadingSpinner text="Loading courses..." size="md" />
            </div>
          ) : error ? (
            <div className="col-span-3 text-center text-red-500 py-20">
              {error}
            </div>
          ) : courses.length === 0 ? (
            <div className="col-span-3 text-center text-gray-400 py-20">
              No courses found.
            </div>
          ) : (
            courses.map((course) => (
              <CourseCard
                key={course.id}
                course={{
                  ...course,
                  cover_image_url: course.image_url,
                  lessons: course.lessons || [],
                }}
              />
            ))
          )}
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </main>

      <CallToAction />
    </div>
  );
};

export default CoursesPage;
