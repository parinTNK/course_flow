"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "@/components/nav";
import CourseCard from "@/components/CourseCard";
import { Course } from "@/types/Course";
import CallToAction from "@/components/landing/CallToAction";
import Pagination from "@/app/admin/components/Pagination"; 
import BackgroundSVGs from "@/components/BackgroundSVGs";
import LoadingSpinner from "@/app/admin/components/LoadingSpinner";

const limit = 12;

const fetchCoursesData = async (
  page: number,
  search: string,
  setCourses: Function,
  setTotalPages: Function,
  setError: Function,
  setLoading: Function
) => {
  setLoading(true);
  setError(null);
  try {
    const res = await axios.get("/api/courses-list", {
      params: { page, limit, search },
    });
    const data = res.data;
    setCourses(data.courses);
    setTotalPages(data.pagination.totalPages);
  } catch (err: any) {
    setError(err.message || "Failed to fetch courses.");
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

  useEffect(() => {
    fetchCoursesData(page, search, setCourses, setTotalPages, setError, setLoading);
  }, [page, search]);

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <BackgroundSVGs />
      <NavBar />
      <main className="flex-1 pt-24 px-6 md:px-20 py-10">
        <div className="text-center max-w-4xl mx-auto py-10">
          <h1 className="text-3xl md:text-4xl font-semibold mt-10">Our Courses</h1>
          <div className="mt-6 max-w-md mx-auto">
            <input
              type="text"
              placeholder=" Search..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {loading ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-20">
              <LoadingSpinner text="Loading courses..." size="md" />
            </div>
          ) : error ? (
            <div className="col-span-3 text-center text-red-500 py-20">{error}</div>
          ) : courses.length === 0 ? (
            <div className="col-span-3 text-center text-gray-400 py-20">No courses found.</div>
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
