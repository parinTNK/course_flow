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
    <div className="mb-12">
      <hr />
      <h2 className="text-center text-2xl font-bold my-6">Other Interesting Courses</h2>
      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent className="-ml-1 md:-ml-2">
          {courses.map((course) => (
            <CarouselItem key={course.id} className="pl-1 md:pl-2 md:basis-1/3">
              <div className="scale-95 px-6">
                <Link href={`/course-detail/${course.id}`}>
                  <CourseCard course={course} />
                </Link>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute -left-4 -translate-y-1/2 bg-white shadow-lg" />
        <CarouselNext className="absolute -right-4 -translate-y-1/2 bg-white shadow-lg" />
      </Carousel>
    </div>
  );
}
