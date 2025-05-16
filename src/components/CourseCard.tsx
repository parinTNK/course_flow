import React from "react";
import { BookOpen, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Course } from "../types/Course";

type CourseCardProps = {
  course: Course;
};

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/course-detail/${course.id}`);
  };

  return (
    <div
      className="bg-white rounded-xl shadow flex flex-col h-full
      cursor-pointer
        transition
        duration-200
        hover:shadow-lg
        hover:-translate-y-1
        active:scale-95
        focus:outline-none
        focus:ring-2
        focus:ring-blue-300
      "
      onClick={handleClick}
      role="button" // support accessibility
      tabIndex={0} //  support accessibility
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick(); //support accessibility
      }}
    >
      <div className="w-full h-[180px] rounded-t-xl overflow-hidden">
        <img
          src={course.cover_image_url}
          alt={course.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-[14px] text-orange-500 font-semibold">
          Course
        </span>
        <h3 className="font-semibold text-lg">{course.name}</h3>
        <p className="text-gray-500 text-[15px] line-clamp-2">
          {course.summary}
        </p>
      </div>
      <div className="flex items-center space-x-6 text-sm p-4 border-t">
        <span className="flex items-center space-x-1">
          <BookOpen className="w-5 h-5 text-[#5483D0]" />
          <span className="text-gray-600">
            {Array.isArray(course.lessons)
              ? course.lessons.length
              : course.lessons}
            {" "} Lessons
          </span>
        </span>
        <span className="flex items-center space-x-1">
          <Clock className="w-5 h-5 text-[#5483D0]" />
          <span className="text-gray-600">
            {course.total_learning_time} Hours
          </span>
        </span>
      </div>
    </div>
  );
};

export default CourseCard;
