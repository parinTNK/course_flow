"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import CourseCard from "@/components/CourseCard";
import { Course } from "@/types/Course";
import CallToAction from "@/components/landing/CallToAction";
import Pagination from "@/app/admin/components/Pagination";
import BackgroundSVGs from "@/components/BackgroundSVGs";
import LoadingSpinner from "@/app/admin/components/LoadingSpinner";

const limit = 12;

const fetchWishlistData = async (
  page: number,
  setCourses: (courses: Course[]) => void,
  setTotalPages: (pages: number) => void,
  setError: (err: string | null) => void,
  setLoading: (loading: boolean) => void
) => {
  setLoading(true);
  setError(null);
  try {
    const res = await axios.get("/api/wishlist", {
      params: { page, limit },
    });
    const data = res.data;
    setCourses(data.courses || []);
    setTotalPages(data.pagination?.totalPages || 1);
  } catch (err: any) {
    setError(
      err?.response?.data?.error || err.message || "Failed to fetch wishlist."
    );
  } finally {
    setLoading(false);
  }
};

const WishlistPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchWishlistData(
      page,
      setCourses,
      setTotalPages,
      setError,
      setLoading
    );
  }, [page]);

  return (
    <div className="min-h-screen flex flex-col bg-transparent overflow-x-hidden">
      <BackgroundSVGs />
      <main className="flex-1 pt-24 pb-10">
        <div className="text-center max-w-4xl mx-auto py-10">
          <h1 className="text-3xl md:text-4xl font-medium sm:mt-10 mb-10 sm:mb-15">
            My Wishlist
          </h1>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-10 w-full overflow-x-hidden pb-10">
          {loading ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-20">
              <LoadingSpinner text="Loading wishlist..." size="md" />
            </div>
          ) : error ? (
            <div className="col-span-3 text-center text-red-500 py-20">
              {error}
            </div>
          ) : courses.length === 0 ? (
            <div className="col-span-3 text-center text-gray-400 py-20">
              No wishlist items found.
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


    </div>
  );
};

export default WishlistPage;