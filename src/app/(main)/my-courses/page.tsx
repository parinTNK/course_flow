"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/context/authContext";
import LoadingSpinner from "../../admin/components/LoadingSpinner";
import Pagination from "@/app/admin/components/Pagination";
import { useMyCourses } from "@/hooks/useMyCourses";

import CourseCard from "@/components/CourseCard";
import Sidebar from "@/components/my-courses/ProfileSidebar";
import BackgroundSVGs from "@/components/BackgroundSVGs";
import Tabs, { TabItem } from "@/components/common/Tabs";
import ErrorBox from "@/components/common/ErrorBox";

const MyCourses: React.FC = () => {
  const [tab, setTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 6;

  const { user, loading: authLoading } = useAuth();

  const {
    courses,
    loading,
    error,
    totalPages,
    allCoursesCount,
    inprogressCount,
    completedCount,
  } = useMyCourses(user?.user_id, tab, currentPage, limit);

  const handleTabChange = (newTab: string) => {
    setTab(newTab);
    setCurrentPage(1);
  };

  const courseTabs: TabItem[] = [
    { label: "All Courses", value: "all" },
    { label: "Inprogress", value: "inprogress" },
    { label: "Completed", value: "completed" },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." className="" size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <BackgroundSVGs />
      <main className="flex-1 pt-30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-8 max-w-6xl mx-auto">
            <div className="w-full">
              <div className="flex flex-col w-full max-w-md mx-auto gap-10">
                <h1 className="text-center text-2xl font-semibold">
                  My Courses
                </h1>
                <Tabs
                  tabs={courseTabs}
                  value={tab}
                  onChange={handleTabChange}
                />
              </div>
            </div>
            {/* Main Content: Sidebar + Grid */}
            <div className="flex flex-col md:flex-row gap-8 w-full">
              {/* Sidebar */}
              <Sidebar
                name={user?.full_name}
                avatarUrl={user?.profile_picture}
                allCoursesCount={allCoursesCount}
                inprogressCount={inprogressCount}
                completedCount={completedCount}
                variant="desktop"
              />
              {/* Courses Grid */}
              <section className="w-full md:w-3/4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loading ? (
                    <div className="col-span-2 flex flex-col items-center justify-center py-20">
                      <LoadingSpinner
                        text="Loading courses..."
                        className=""
                        size="md"
                      />
                    </div>
                  ) : error ? (
                    <div className="col-span-2 flex flex-col items-center justify-center py-20">
                      <ErrorBox
                        responseMessage="Unable to load your courses"
                        message={error}
                      />
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="col-span-2 text-center text-gray-400 py-20">
                      No courses found.
                    </div>
                  ) : (
                    courses.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))
                  )}
                </div>
                {/* Pagination */}
                {!loading && !error && courses.length > 0 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
      <div className="block md:hidden">
        <Sidebar
          name={user?.full_name}
          avatarUrl={user?.profile_picture}
          allCoursesCount={allCoursesCount}
          inprogressCount={inprogressCount}
          completedCount={completedCount}
          variant="mobile"
        />
      </div>
    </div>
  );
};

export default MyCourses;
