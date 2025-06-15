import React from "react";

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

      {/* Simple course list - ตาม Figma */}
      <div className="space-y-1">
        {courses.map((course, index) => (
          <div
            key={course.id}
            className="text-blue-500 hover:text-blue-600 cursor-pointer"
          >
            {course.name}
            {index < courses.length - 1 && ", "}
          </div>
        ))}
      </div>
    </div>
  );
}
