import React from "react";
import { ButtonT } from "@/components/ui/ButtonT";

interface Course {
  id: string;
  name: string;
  price: number;
  summary?: string;
  status: "active" | "inactive";
}

interface EditBundleCourseSelectionProps {
  availableCourses: Course[];
  selectedCourses: Course[];
  coursesLoading: boolean;
  onAddCourse: () => void;
  onCourseSelect: (index: number, courseId: string) => void;
  onDeleteCourse: (index: number) => void;
  getAvailableCoursesForSelection: (currentIndex?: number) => Course[];
  canAddMoreCourses: () => boolean;
}

export const EditBundleCourseSelection: React.FC<
  EditBundleCourseSelectionProps
> = ({
  availableCourses,
  selectedCourses,
  coursesLoading,
  onAddCourse,
  onCourseSelect,
  onDeleteCourse,
  getAvailableCoursesForSelection,
  canAddMoreCourses,
}) => {
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
          {selectedCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No courses selected yet</p>
              <p className="text-sm">
                Click "Add Course" to start adding courses to this bundle
              </p>
            </div>
          ) : (
            selectedCourses.map((course, index) => (
              <div
                key={`course-${index}-${course.id}`}
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
                      {/* แสดง placeholder เฉพาะเมื่อยังไม่ได้เลือก */}
                      {course.id === "" && (
                        <option value="" disabled className="text-gray-400">
                          Select a course...
                        </option>
                      )}

                      {/* แสดงคอร์สที่เลือกไว้แล้ว */}
                      {course.id !== "" &&
                        course.name &&
                        course.name !== "Place Holder" && (
                          <option
                            value={course.id}
                            key={`selected-${course.id}`}
                          >
                            {course.name}
                          </option>
                        )}

                      {/* แสดง courses ที่เลือกได้ (ไม่รวมที่เลือกแล้ว) */}
                      {getAvailableCoursesForSelection(index)
                        .filter(
                          (availableCourse) => availableCourse.id !== course.id
                        )
                        .map((availableCourse) => (
                          <option
                            key={`available-${availableCourse.id}`}
                            value={availableCourse.id}
                          >
                            {availableCourse.name}
                          </option>
                        ))}
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
            ))
          )}

          <ButtonT
            variant="Secondary"
            onClick={onAddCourse}
            disabled={!canAddMoreCourses()}
            className="text-center"
          >
            <div className="flex items-center justify-center space-x-1">
              <span>+</span>
              <span>Add</span>
              <span>Course</span>
            </div>
          </ButtonT>

          {!canAddMoreCourses() && (
            <p className="text-gray-500 text-sm mt-2">
              No more courses available to add.
            </p>
          )}
        </>
      )}
    </div>
  );
};
