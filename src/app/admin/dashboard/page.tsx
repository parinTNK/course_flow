"use client";

import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { FiPlus } from 'react-icons/fi'; 
import { useRouter } from 'next/navigation';
import SearchBar from '../components/SearchBar';
import CoursesTable from '../components/CoursesTable'; 

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/courses-list');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch courses: ${response.statusText}`);
        }
        const data: Course[] = await response.json();
        setCourses(data);
      } catch (err) {
        setError((err as Error).message);
        console.error("Error fetching courses:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleAddCourse = () => {
  
    alert('Add course functionality to be implemented');
  };

  const handleEditCourse = (id: string) => {

    alert(`Edit course ${id} functionality to be implemented`);
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await fetch(`/api/admin/courses-delete/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete course');
        }
        setCourses(prevCourses => prevCourses.filter(course => course.id !== id));
        alert('Course deleted successfully');
      } catch (err) {
        alert(`Error deleting course: ${(err as Error).message}`);
        console.error("Error deleting course:", err);
      }
    }
  };

  const filteredCourses = courses.filter(course =>
    (course.name || course.course_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
    
      return `${date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return dateString;
    }
  };

  return (
    <div className="p-6 bg-gray-50 flex-1">
      <div className="flex justify-between items-center mb-6">
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

      {isLoading && <div className="text-center py-10 text-gray-600">Loading courses...</div>}
      {error && <div className="text-center py-10 text-red-600 bg-red-100 p-4 rounded-md">Error: {error}</div>}

      {!isLoading && !error && (
        <CoursesTable
          courses={filteredCourses}
          onEditCourse={handleEditCourse}
          onDeleteCourse={handleDeleteCourse}
          formatDate={formatDate}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}