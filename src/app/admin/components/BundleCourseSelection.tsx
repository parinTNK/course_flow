import React from "react";

interface Course {
  id: string;
  name: string;
  price: number;
  summary?: string;
  status: "active" | "inactive";
}

interface BundleCourseSelectionProps {
  availableCourses: Course[];
  selectedCourses: Course[];
  coursesLoading: boolean;
  onAddCourse: () => void;
  onCourseSelect: (index: number, courseId: string) => void;
  onDeleteCourse: (index: number) => void;
  getAvailableCoursesForSelection: (currentIndex?: number) => Course[];
  canAddMoreCourses: () => boolean;
}

export const BundleCourseSelection: React.FC<BundleCourseSelectionProps> = ({
  availableCourses,
  selectedCourses,
  coursesLoading,
  onAddCourse,
  onCourseSelect,
  onDeleteCourse,
  getAvailableCoursesForSelection,
  canAddMoreCourses,
}) => {
  // ตรวจสอบว่ายังมี course ให้เลือกไหม (ลบ function นี้แล้ว)

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Course in this Bundle
      </h3>

      {coursesLoading ? (
        <div className="text-center py-4">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
            Loading courses...
          </div>
        </div>
      ) : (
        <>
          {selectedCourses.map((course, index) => (
            <div
              key={index}
              className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course *
                  </label>
                  <select
                    value={course.id}
                    onChange={(e) => onCourseSelect(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {/* Place Holder option */}
                    <option value="" disabled className="text-gray-400">
                      Place Holder
                    </option>

                    {/* แสดงเฉพาะ courses ที่เลือกได้ */}
                    {getAvailableCoursesForSelection(index).map(
                      (availableCourse) => (
                        <option
                          key={availableCourse.id}
                          value={availableCourse.id}
                        >
                          {availableCourse.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteCourse(index)}
                  className="ml-4 text-blue-600 hover:text-blue-800 transition font-medium cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={onAddCourse}
            disabled={!canAddMoreCourses()}
            className="text-orange-600 hover:text-orange-800 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            + Add Course
          </button>

          {!canAddMoreCourses() && (
            <p className="text-gray-500 text-sm mt-2">
              No courses available. Please create courses first.
            </p>
          )}
        </>
      )}
    </div>
  );
};
