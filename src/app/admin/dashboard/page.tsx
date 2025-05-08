"use client";

import React, { useCallback } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import SearchBar from '../components/SearchBar';
import CoursesTable from '../components/CoursesTable';
import Pagination from '../components/Pagination';
import { useCoursesContext } from '../context/CoursesContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DashboardPage() {
  const router = useRouter();
  const {
    courses,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    handleDeleteCourse,
    // Pagination
    currentPage,
    totalPages,
    setCurrentPage
  } = useCoursesContext();

  const handleAddCourse = useCallback(() => {
    alert('Add course functionality to be implemented');
  }, [router]);

  const handleEditCourse = useCallback((id: string) => {
    alert(`Edit course ${id} functionality to be implemented`);
  }, [router]);

  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return dateString;
    }
  }, []);

  return (
    <div className="bg-gray-100 flex-1 min-h-full">
      <div className="flex justify-between items-center mb-12 bg-white p-8 border-b-3 border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-800">Course</h1>
        <div className="flex items-center space-x-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search courses..."
            className="w-64"
          />
          <button
            onClick={handleAddCourse}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition"
          >
            <FiPlus size={20} />
            <span>Add Course</span>
          </button>
        </div>
      </div>
      <div className='px-8 pb-8'>
        {isLoading && <LoadingSpinner text="Loading courses..." size="md" />}
        {error && <div className="text-center py-10 text-red-600 bg-red-100 p-4 rounded-md">Error: {error}</div>}

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

        {/* //TODO: check with team position is ok or not  */}
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