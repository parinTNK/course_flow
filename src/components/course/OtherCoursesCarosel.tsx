import React from "react";
import Link from "next/link";
import CourseCard from "@/components/CourseCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type Props = {
  courses: any[];
};

export default function OtherCoursesCarousel({ courses }: Props) {
  if (!courses.length) return null;

  return (
    <div className="mb-7 sm:mb-12">
      <hr />
      <h2 className="text-center text-xl sm:text-2xl font-bold my-4 sm:my-6">Other Interesting Courses</h2>
      <Carousel opts={{ align: "start", loop: true }} className="w-full px-0 sm:px-12 relative">
  <CarouselContent className="flex gap-4">
    {courses.map((course) => (
      <CarouselItem
        key={course.id}
        className="w-[85%] sm:w-[60%] md:basis-1/3"
      >
        <div className="scale-90 md:scale-95">
          <Link href={`/course-detail/${course.id}`}>
            <CourseCard course={course} />
          </Link>
        </div>
      </CarouselItem>
    ))}
  </CarouselContent>

  <CarouselPrevious className="hidden sm:flex absolute left-0 -translate-y-1/2 bg-white shadow-lg" />
  <CarouselNext className="hidden sm:flex absolute right-0 -translate-y-1/2 bg-white shadow-lg" />

</Carousel>

    </div>
  );
}
