import React from "react";
import Image from "next/image";
import { FiImage } from "react-icons/fi";
import { Course } from "../types";

interface CourseRowProps {
  course: Course;
  index: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (dateString: string) => string;
}

const CourseRow: React.FC<CourseRowProps> = ({
  course,
  index,
  onEdit,
  onDelete,
  formatDate,
}) => {
  const getStatusBadgeClass = (status: string) => {
    status = status?.toLowerCase();
    if (status === "published") {
      return "bg-green-100 text-green-800 px-4 py-[1px] w-24 rounded-full text-center flex justify-center";
    }
    return "bg-yellow-100 text-yellow-800 px-4 py-[1px] w-24 rounded-full text-center flex justify-center";
  };

  return (
    <tr key={course.id} className="hover:bg-gray-50 transition">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {index}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="w-16 h-10 relative rounded overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50">
          {course.image_url ? (
            <Image
              src={course.image_url}
              alt={course.name || course.course_name || "Course image"}
              layout="fill"
              objectFit="cover"
              className="rounded"
            />
          ) : (
            <FiImage className="w-6 h-6 text-gray-400" />
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {course.name || course.course_name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {course.lessons_count ?? "N/A"} Lessons
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {course.price !== null && course.price !== undefined
          ? `${course.price.toFixed(2)}`
          : "N/A"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
            course.status
          )}`}
        >
          {course.status || "N/A"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {formatDate(course.created_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {formatDate(course.updated_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
        <button
          onClick={() => onDelete(course.id)}
          className="text-blue-600 hover:text-blue-800 mr-3 transition"
          aria-label="Delete course"
        >
          <Image
            src="/delete.svg"
            alt="Edit"
            width={18}
            height={18}
            className="inline-block"
          />
        </button>
        <button
          onClick={() => onEdit(course.id)}
          className="text-blue-600 hover:text-blue-800  transition"
          aria-label="Edit course"
        >
          <Image
            src="/edit.svg"
            alt="Edit"
            width={18}
            height={18}
            className="inline-block"
          />
        </button>
      </td>
    </tr>
  );
};

export default CourseRow;
