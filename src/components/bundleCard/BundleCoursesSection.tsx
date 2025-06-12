import React from "react";
import Link from "next/link";
import { Clock, BookOpen } from "lucide-react";

type Course = {
  id: string;
  name: string;
  summary?: string;
  image_url?: string;
  total_learning_time?: number;
  lessons?: number;
  price?: number;
};

type Props = {
  courses: Course[];
  isPurchased?: boolean;
};

export default function BundleCoursesSection({
  courses,
  isPurchased = false,
}: Props) {
  if (!courses.length) {
    return (
      <div className="my-12">
        <h2 className="text-2xl font-bold mb-4">Courses in this Package</h2>
        <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
          No courses available in this bundle
        </div>
      </div>
    );
  }

  return (
    <div className="my-12">
      <h2 className="text-2xl font-bold mb-6">Courses in this Package</h2>

      <div className="space-y-4">
        {courses.map((course, index) => (
          <div
            key={course.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Course Number */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
              </div>

              {/* Course Image */}
              <div className="w-full md:w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
                {course.image_url ? (
                  <img
                    src={course.image_url}
                    alt={course.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    No Image
                  </div>
                )}
              </div>

              {/* Course Content */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {course.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {course.summary || "No description available"}
                    </p>

                    {/* Course Stats */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.lessons || 0} Lessons</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.total_learning_time || 0} Hours</span>
                      </span>
                    </div>
                  </div>

                  {/* Course Price & Action */}
                  <div className="flex flex-col items-end space-y-2">
                    <div className="text-right">
                      <div className="text-sm text-gray-500 line-through">
                        ฿{course.price?.toLocaleString() || "0"}
                      </div>
                      <div className="text-green-600 font-semibold text-sm">
                        Included in Bundle
                      </div>
                    </div>

                    {isPurchased ? (
                      <Link
                        href={`/course-detail/${course.id}`}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 transition-colors"
                      >
                        Start Learning
                      </Link>
                    ) : (
                      <Link
                        href={`/course-detail/${course.id}`}
                        className="border border-blue-500 text-blue-500 px-4 py-2 rounded-md text-sm hover:bg-blue-50 transition-colors"
                      >
                        View Course
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bundle Summary */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h4 className="font-semibold text-blue-900">Bundle Summary</h4>
            <p className="text-sm text-blue-700">
              {courses.length} courses •{" "}
              {courses.reduce(
                (total, course) => total + (course.total_learning_time || 0),
                0
              )}{" "}
              hours total
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-600">
              Individual course value: ฿
              {courses
                .reduce((total, course) => total + (course.price || 0), 0)
                .toLocaleString()}
            </div>
            <div className="text-lg font-bold text-blue-900">
              Bundle savings available!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
