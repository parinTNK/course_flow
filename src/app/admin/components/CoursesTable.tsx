import React from "react";
import CourseRow from "./CourseRow";
import { Course } from "../types";

interface CoursesTableProps {
  courses: Course[];
  onEditCourse: (id: string) => void;
  onDeleteCourse: (id: string) => void;
  formatDate: (dateString: string) => string;
  isLoading: boolean;
  currentPage: number;
}

const CoursesTable: React.FC<CoursesTableProps> = ({
  courses,
  onEditCourse,
  onDeleteCourse,
  formatDate,
  isLoading,
  currentPage,
}) => {
  if (!isLoading && courses.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-gray-500 bg-white shadow-md rounded-lg">
        No courses found.
      </div>
    );
  }

  const tableHeaderClasses =
    "px-6 py-3 text-left text-[14px] font-medium text-gray-500 uppercase tracking-wider";
  const coursesPerPage = 10;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-300">
            <tr>
              {[
                "",
                "Image",
                "Course name",
                "Lesson",
                "Price",
                "Status",
                "Created date",
                "Updated date",
                "Action",
              ].map((header, idx) => (
                <th
                  key={idx}
                  className={`${tableHeaderClasses} ${
                    header === "Action" ? "text-center" : ""
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course, index) => (
              <CourseRow
                key={course.id}
                course={course}
                index={(currentPage - 1) * coursesPerPage + index + 1}
                onEdit={onEditCourse}
                onDelete={onDeleteCourse}
                formatDate={formatDate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoursesTable;
