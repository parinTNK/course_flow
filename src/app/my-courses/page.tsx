"use client";

import React, { useState, useEffect } from "react";
import NavBar from "@/components/nav";
import Footer from "@/components/footer";
import axios from "axios";
import { BookOpen, Clock } from "lucide-react";

type Lesson = {
  id: string;
  title: string;
  order_no: number;
  course_id: string;
  created_at: string;
  updated_at: string;
};

type Course = {
  id: string;
  name: string;
  price: number;
  status: string;
  lessons: Lesson[];
  summary: string;
  cover_image_url: string;
  total_learning_time: number;
  progress: number;
};

const mockUser = {
  name: "John Donut",
  avatarUrl: "https://i.pravatar.cc/150?img=45",
  id: "35557ac8-fb44-4052-9c73-8fc50a3edda1",
};

const MyCourses: React.FC = () => {
  const [tab, setTab] = useState<"all" | "inprogress" | "completed">("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `http://localhost:3000/api/my-course/${mockUser.id}`
        );
        setCourses(res.data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar user={mockUser} />
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
              <aside className="hidden md:flex w-full md:w-1/4 flex-col items-center">
                <div className="bg-white rounded-xl shadow p-6 w-full flex flex-col items-center sticky top-24">
                  <img
                    src={mockUser.avatarUrl}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                  <h2 className="mt-4 text-xl text-gray-800">
                    {mockUser.name}
                  </h2>
                  <div className="flex justify-between w-full mt-6 gap-2">
                    <div className="flex flex-col bg-gray-200 gap-4 p-4 rounded-[8px] w-1/2">
                      <div className="text-sm text-gray-700">
                        Course Inprogress
                      </div>
                      <div className="text-xl font-bold">{inprogressCount}</div>
                    </div>
                    <div className="flex flex-col bg-gray-200 gap-4 p-4 rounded-[8px] w-1/2">
                      <div className="text-sm text-gray-700">
                        Course Complete
                      </div>
                      <div className="text-xl font-bold">{completedCount}</div>
                    </div>
                  </div>
                </div>
              </aside>
              {/* Courses Grid */}
              <section className="w-full md:w-3/4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loading ? (
                    <div className="col-span-2 text-center text-gray-400 py-20">
                      Loading...
                    </div>
                  ) : error ? (
                    <div className="col-span-2 text-center text-red-500 py-20">
                      {error}
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="col-span-2 text-center text-gray-400 py-20">
                      No courses found.
                    </div>
                  ) : (
                    filteredCourses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white rounded-xl shadow flex flex-col h-full"
                      >
                        <div className="w-full h-[180px] rounded-t-xl overflow-hidden">
                          <img
                            src={course.cover_image_url}
                            alt={course.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4 flex flex-col gap-2 flex-1">
                          <span className="text-[14px] text-orange-500 font-semibold">
                            Course
                          </span>
                          <h3 className="font-semibold text-lg">
                            {course.name}
                          </h3>
                          <p className="text-gray-500 text-[15px] line-clamp-2">
                            {course.summary}
                          </p>
                        </div>
                        <div className="flex items-center space-x-6 text-sm p-4 border-t">
                          <span className="flex items-center space-x-1">
                            <BookOpen className="w-5 h-5 text-[#5483D0]" />
                            <span className="text-gray-600">
                              {course.lessons.length} Lessons
                            </span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-5 h-5 text-[#5483D0]" />
                            <span className="text-gray-600">
                              {course.total_learning_time} Hours
                            </span>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <div className="block md:hidden">
        <aside className="w-full flex flex-col items-center">
          <div className="bg-white shadow p-4 w-full">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={mockUser.avatarUrl}
                alt="Profile"
                width={36}
                height={36}
                className="rounded-full"
              />
              <span className="text-[17px] font-medium text-[#444]">
                {mockUser.name}
              </span>
            </div>
            <div className="flex gap-3">
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
      </div>
    </div>
  );
};

export default MyCourses;
