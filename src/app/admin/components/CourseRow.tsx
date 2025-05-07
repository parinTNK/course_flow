import React from 'react';
import Image from 'next/image';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Course } from '../types';

interface CourseRowProps {
  course: Course;
  index: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (dateString: string) => string;
}

const CourseRow: React.FC<CourseRowProps> = ({ course, index, onEdit, onDelete, formatDate }) => {
  return (
    <tr key={course.id} className="hover:bg-gray-50 transition">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{index + 1}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="w-16 h-10 relative rounded overflow-hidden">
          <Image
            src={course.image_url || '/placeholder-image.png'} // Ensure placeholder exists
            alt={course.name || course.course_name || 'Course image'}
            layout="fill"
            objectFit="cover"
            className="rounded"
          />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.name || course.course_name}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{course.lessons_count ?? 'N/A'} Lessons</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {course.price !== null && course.price !== undefined ? `$${course.price.toFixed(2)}` : 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(course.created_at)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(course.updated_at)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
        <button
          onClick={() => onEdit(course.id)}
          className="text-blue-600 hover:text-blue-800 mr-3 transition"
          aria-label="Edit course"
        >
          <FiEdit2 size={18} />
        </button>
        <button
          onClick={() => onDelete(course.id)}
          className="text-red-600 hover:text-red-800 transition"
          aria-label="Delete course"
        >
          <FiTrash2 size={18} />
        </button>
      </td>
    </tr>
  );
};

export default CourseRow;