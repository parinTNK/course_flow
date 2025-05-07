import React from 'react';
import CourseRow from './CourseRow'; 
import { Course } from '../types';

interface CoursesTableProps {
  courses: Course[];
  onEditCourse: (id: string) => void;
  onDeleteCourse: (id: string) => void;
  formatDate: (dateString: string) => string;
  isLoading: boolean; 
}

const CoursesTable: React.FC<CoursesTableProps> = ({ courses, onEditCourse, onDeleteCourse, formatDate, isLoading }) => {
  if (courses.length === 0 && !isLoading) {
    return (
      <div className="px-6 py-10 text-center text-gray-500 bg-white shadow-md rounded-lg">
        No courses found.
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated date</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {courses.map((course, index) => (
            <CourseRow
              key={course.id}
              course={course}
              index={index}
              onEdit={onEditCourse}
              onDelete={onDeleteCourse}
              formatDate={formatDate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CoursesTable;