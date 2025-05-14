"use client";

import React, { useCallback } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import SearchBar from '../components/SearchBar';
import CoursesTable from '../components/CoursesTable';
import Pagination from '../components/Pagination';
import { useCoursesContext } from '../context/CoursesContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { ButtonT } from '@/components/ui/ButtonT';

export default function DashboardPage() {
  const router = useRouter();
  const {
    courses,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    handleDeleteCourse,
    currentPage,
    totalPages,
    setCurrentPage,
  } = useCoursesContext();

  const handleAddCourse = useCallback(() => {
    router.push('/admin/dashboard/create-courses');
  }, [router]);

  const handleEditCourse = useCallback(
    (id: string) => {
      alert(`Edit course ${id} functionality to be implemented`);
    },
    [router]
  );

  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })} ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return dateString;
    }
  }, []);

  return (
    <div className="bg-gray-100 flex-1 h-screen overflow-hidden">
      <div className="flex justify-between items-center mb-8 bg-white px-8 py-6 border-b-3 border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-800">Course</h1>
        <div className="flex items-center space-x-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search courses..."
            className="w-64"
          />
          <ButtonT
            onClick={handleAddCourse}
            className='w-[200px] flex justify-center items-center gap-3'
          >
            <FiPlus size={20} />
            <span>Add Course</span>
          </ButtonT>
        </div>
      </div>
      <div className="px-8 pb-8">
        {isLoading && <LoadingSpinner text="Loading courses..." size="md" />}
        {error && (
          <div className="text-center py-10 text-red-600 bg-red-100 p-4 rounded-md">
            Error: {error}
          </div>
        )}

        {!isLoading && !error && (
          <>
            <CoursesTable
              courses={courses}
              onEditCourse={handleEditCourse}
              onDeleteCourse={handleDeleteCourse}
              formatDate={formatDate}
              isLoading={isLoading}
              currentPage={currentPage}
            />
            {courses.length === 0 && (
              <div className="px-6 py-10 text-center text-gray-500 bg-white shadow-md rounded-lg">
                No courses found.
              </div>
            )}
          </>
        )}

        {courses.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
