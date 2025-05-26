import React, { useState } from "react";
import CourseRow from "./CourseRow";
import { Course } from "../types";
import ConfirmationModal from "./ConfirmationModal";
import StudentSubscriptionWarningModal from "./StudentSubscriptionWarningModal";
import { useCoursesContext } from "../context/CoursesContext";
import { useCustomToast } from "../../../components/ui/CustomToast";

interface CoursesTableProps {
  courses: Course[];
  onEditCourse: (id: string) => void;
  formatDate: (dateString: string) => string;
  isLoading: boolean;
  currentPage: number;
}

const CoursesTable: React.FC<CoursesTableProps> = ({
  courses,
  onEditCourse,
  formatDate,
  isLoading,
  currentPage,
}) => {
  const { fetchCourses } = useCoursesContext();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const { success, error: toastError } = useCustomToast();

  const checkSubscription = async (courseId: string) => {
    const res = await fetch(`/api/admin/courses/${courseId}/has-subscription`);
    const data = await res.json();
    return data.hasSubscription;
  };

  const handleDeleteClick = async (course: Course) => {
    setSelectedCourse(course);
    if (!course) return;
    setShowConfirmModal(true);
  };

  const handleActualDeleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(
        `/api/admin/courses-delete/${courseId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete course");
      }

      success(
        "Course deleted successfully",
        "The course has been removed from the system."
      );

      fetchCourses();
    } catch (err) {
      toastError(
        "Failed to delete course",
        err instanceof Error ? err.message : "Unknown error"
      );
      console.error("Error deleting course:", err);
    } finally {
      handleCloseAll();
    }
  };

  const handleProceedWarning = () => {
    if (!selectedCourse) return;
    handleActualDeleteCourse(selectedCourse.id);
  };

  const handleCloseAll = () => {
    setShowWarningModal(false);
    setShowConfirmModal(false);
    setSelectedCourse(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCourse) return;
    const hasSub = await checkSubscription(selectedCourse.id);
    setHasSubscription(hasSub);
    if (hasSub) {
      setShowConfirmModal(false);
      setShowWarningModal(true);
    } else {
      handleActualDeleteCourse(selectedCourse.id);
    }
  };

  const tableHeaderClasses =
    "px-6 py-3 text-left text-[14px] font-medium text-gray-500 uppercase tracking-wider";
  const coursesPerPage = 10;

  if (!isLoading && courses.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-gray-500 bg-white shadow-md rounded-lg">
        No courses found.
      </div>
    );
  }


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
                // "Status",
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
                onDelete={() => handleDeleteClick(course)}
                formatDate={formatDate}
              />
            ))}
          </tbody>
        </table>
      </div>
      <StudentSubscriptionWarningModal
        isOpen={showWarningModal}
        onClose={handleCloseAll}
        onProceed={handleProceedWarning}
        courseName={selectedCourse?.name || ""}
      />
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseAll}
        onConfirm={handleConfirmDelete}
        title="Delete Course"
        message={`Are you sure you want to delete this course: "${selectedCourse?.name}"?`}
        confirmText="Yes, I want to delete the course"
        cancelText="No, keep it"
        requireCourseName={false}
        courseName={selectedCourse?.name || ""}
      />
    </div>
  );
};

export default CoursesTable;
