"use client";

import React, { useState, useEffect } from "react";
import CourseCard from "@/components/CourseCard";
import axios from "axios";
import type { Course } from "@/types/Course";
import { useAuth } from "@/app/context/authContext";
import LoadingSpinner from "../../admin/components/LoadingSpinner";
import { AlertCircle } from "lucide-react";

const MyCourses: React.FC = () => {
  const [tab, setTab] = useState<"all" | "inprogress" | "completed">("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user,loading: authLoading } = useAuth();



  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user?.user_id) {
      setCourses([]);
      setLoading(false);
      return;
    }


    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/users/${user?.user_id}/courses`);
        setCourses(res.data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user?.user_id, authLoading]);

  console.log(courses);


  const filteredCourses = courses.filter((course) => {
    if (tab === "all") return true;
    if (tab === "inprogress")
      return course.progress > 0 && course.progress < 99;
    if (tab === "completed") return course.progress === 100;
    return true;
  });

  const inprogressCount = courses.filter(
    (course) => course.progress > 0 && course.progress < 99
  ).length;
  const completedCount = courses.filter(
    (course) => course.progress === 100
  ).length;

  const allCouresCount = courses.length;


  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 pt-30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-8 max-w-6xl mx-auto">
            {/* Tabs */}
            <div className="w-full">
              <div className="flex flex-col w-full max-w-md mx-auto gap-10">
                <h1 className="text-center text-2xl font-semibold">
                  My Courses
                </h1>
                <div className="flex items-center justify-center gap-6">
                  <button
                    className={`pb-2 font-semibold border-b-2 cursor-pointer ${
                      tab === "all"
                        ? "border-black"
                        : "border-transparent text-gray-400"
                    }`}
                    onClick={() => setTab("all")}
                  >
                    All Courses
                  </button>
                  <button
                    className={`pb-2 font-semibold border-b-2 cursor-pointer ${
                      tab === "inprogress"
                        ? "border-black"
                        : "border-transparent text-gray-400"
                    }`}
                    onClick={() => setTab("inprogress")}
                  >
                    Inprogress
                  </button>
                  <button
                    className={`pb-2 font-semibold border-b-2 cursor-pointer ${
                      tab === "completed"
                        ? "border-black"
                        : "border-transparent text-gray-400"
                    }`}
                    onClick={() => setTab("completed")}
                  >
                    Completed
                  </button>
                </div>
              </div>
            </div>
            {/* Main Content: Sidebar + Grid */}
            <div className="flex flex-col md:flex-row gap-8 w-full">
              {/* Sidebar */}
              <Sidebar
                name={user?.full_name}
                avatarUrl={user?.profile_picture}
                allCouresCount={allCouresCount}
                inprogressCount={inprogressCount}
                completedCount={completedCount}
                variant="desktop"
              />
              {/* Courses Grid */}
              <section className="w-full md:w-3/4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loading ? (
                    <div className="col-span-2 flex flex-col items-center justify-center py-20">
                      <LoadingSpinner text="Loading courses..." className = '' size="md" />
                    </div>
                  ) : error ? (
                    <div className="col-span-2 flex flex-col items-center justify-center py-20">
                      <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-8 flex flex-col items-center shadow-sm">
                        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                        <span className="text-red-600 font-semibold text-lg mb-1">
                          Unable to load your courses
                        </span>
                        <span className="text-gray-500 text-sm text-center">
                          {error}
                        </span>
                      </div>
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="col-span-2 text-center text-gray-400 py-20">
                      No courses found.
                    </div>
                  ) : (
                    filteredCourses.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <div className="block md:hidden">
        <Sidebar
          name={user?.full_name}
          avatarUrl={user?.profile_picture}
          allCouresCount={allCouresCount}
          inprogressCount={inprogressCount}
          completedCount={completedCount}
          variant="mobile"
        />
      </div>
    </div>
  );
};

export default MyCourses;

const Sidebar: React.FC<{
  name: string | undefined;
  avatarUrl: string | undefined;
  allCouresCount: number | undefined;
  inprogressCount: number | undefined;
  completedCount: number | undefined;
  variant: "desktop" | "mobile";
}> = ({ name, avatarUrl, allCouresCount, inprogressCount, completedCount, variant }) => {
  if (variant === "desktop") {
    return (
      <aside className="hidden md:flex w-full md:w-1/3 flex-col items-center">
        <div className="bg-white rounded-xl shadow p-6 w-full flex flex-col items-center sticky top-24">
          <img
            src={avatarUrl}
            alt="Profile"
            width={80}
            height={80}
            className="rounded-full"
          />
          <h2 className="mt-4 text-xl text-gray-800">{name}</h2>
          <div className="flex justify-between w-full mt-6 gap-2">
          <div className="flex flex-col bg-gray-200 gap-4 p-4 rounded-[8px] w-1/3">
              <div className="text-sm text-gray-700">All Course</div>
              <div className="text-xl font-bold">{allCouresCount}</div>
            </div>
            <div className="flex flex-col bg-gray-200 gap-4 p-4 rounded-[8px] w-1/3">
              <div className="text-sm text-gray-700">Course Inprogress</div>
              <div className="text-xl font-bold">{inprogressCount}</div>
            </div>
            <div className="flex flex-col bg-gray-200 gap-4 p-4 rounded-[8px] w-1/3">
              <div className="text-sm text-gray-700">Course Complete</div>
              <div className="text-xl font-bold">{completedCount}</div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // mobile
  return (
    <aside className="w-full flex flex-col items-center md:hidden">
      <div className="bg-white shadow p-4 w-full">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={avatarUrl}
            alt="Profile"
            width={36}
            height={36}
            className="rounded-full"
          />
          <span className="text-[17px] font-medium text-[#444]">{name}</span>
        </div>
        <div className="flex gap-3">
        <div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2 flex-1">
            <span className="text-xs text-gray-400">All Course</span>
            <span className="text-lg font-bold text-gray-700">
              {inprogressCount}
            </span>
          </div>
          <div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2 flex-1">
            <span className="text-xs text-gray-400">Course Inprogress</span>
            <span className="text-lg font-bold text-gray-700">
              {inprogressCount}
            </span>
          </div>
          <div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2 flex-1">
            <span className="text-xs text-gray-400">Course Complete</span>
            <span className="text-lg font-bold text-gray-700">
              {completedCount}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
