"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/context/authContext";
import CourseCard from "@/components/CourseCard";
import CallToAction from "@/components/landing/CallToAction";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingSpinner from "@/app/admin/components/LoadingSpinner";
import { useCustomToast } from "@/components/ui/CustomToast";
import { getBangkokISOString } from "@/lib/bangkokTime";
import { ButtonT } from "@/components/ui/ButtonT";
import { VideoOff } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const CourseDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;

  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  const { success } = useCustomToast();

  const [courses, setCourses] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [otherCourses, setOtherCourses] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isFetchingCourseData, setIsFetchingCourseData] = useState(false);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Fetch course + modules + other courses
  useEffect(() => {
    const fetchCourseData = async () => {
      setIsFetchingCourseData(true);
      try {
        const { data: courseData } = await supabase
          .from("courses")
          .select("id, name, summary, detail, video_trailer_url, attachment_url, price")
          .eq("id", courseId)
          .single();

        if (courseData) setCourses(courseData);

        const { data: moduleData } = await supabase
          .from("lessons")
          .select("id, title, order_no, sub_lessons(id, title)")
          .eq("course_id", courseId)
          .order("order_no", { ascending: true });

        if (moduleData) setModules(moduleData);

        const { data: otherCourseData } = await supabase
          .from("courses")
          .select("id, name, summary, price, cover_image_url, lessons!inner(id, sub_lessons(count))")
          .neq("id", courseId)
          .eq("status", "published");

        if (otherCourseData) {
          const formatted = otherCourseData.map((course: any) => {
            const total = course.lessons.reduce(
              (sum: number, lesson: any) => sum + (lesson.sub_lessons?.count || 0),
              0
            );
            return { ...course, total_lessons: total };
          });
          setOtherCourses(formatted);
        }
      } catch (err) {
        console.error("Fetch course data failed", err);
      } finally {
        setIsFetchingCourseData(false);
      }
    };

    if (!loading && courseId) {
      fetchCourseData();
    }
  }, [loading, courseId]);

  // Fetch subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data: subscriptionData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("course_id", courseId)
          .eq("user_id", user?.user_id)
          .single();

        if (subscriptionData) setIsSubscribed(true);
      } catch (err) {
        console.error("Subscription fetch failed", err);
      }
    };

    if (user && courseId) {
      fetchSubscription();
    }
  }, [user, courseId]);

  // Fetch wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user || !courseId) return;
    
      const { data, error } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", user.user_id)
      .eq("course_id", courseId)
      .single();
      if (data) setIsWishlisted(true);
    };

    fetchWishlist();
  }, [user, courseId]);

   if (loading || isFetchingCourseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  const toggleModule = (moduleId: number) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto mt-20 px-4 py-8">
        <Link href="/our-courses" className="text-blue-600 mb-6 inline-flex items-center">
          <img src="/Left-Arrow.svg" alt="Back Button" className="mr-1" />
          <span>Back</span>
        </Link>

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Left (Course Content) */}
          <div className="md:col-span-2">
            {courses?.video_trailer_url ? (
              <video className="w-full h-[400px] bg-gray-200 rounded-lg" controls>
                <source src={courses.video_trailer_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex items-center justify-center w-full h-[400px] bg-gray-200 rounded-lg text-gray-500 text-sm">
                <VideoOff className="w-10 h-10 mb-2" />
                <span>Video not found</span>
              </div>
            )}

            <div className="my-12">
              <h2 className="text-2xl font-bold mb-4">Course Detail</h2>
              <div className="prose max-w-none text-gray-600 break-words">
                {courses?.detail?.split("\n\n").map((para: string, idx: number) => (
                  <p key={idx} className="mb-4 whitespace-pre-line">{para}</p>
                ))}
              </div>
            </div>

            {isAuthenticated && isSubscribed && (
              <div className="my-12">
                <h2 className="text-2xl font-bold mb-4">Attach File</h2>
                {courses?.attachment_url ? (
                  <a
                    href={courses.attachment_url}
                    download
                    className="block bg-blue-50 p-4 rounded-lg max-w-sm hover:bg-blue-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-white p-2 rounded">
                        <img src="/file.svg" alt="Document" className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{courses.name}.pdf</p>
                        <p className="text-xs text-gray-500">68 mb</p>
                      </div>
                    </div>
                  </a>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-500 max-w-md">
                    No attachment file available for this course
                  </div>
                )}
              </div>
            )}

            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Module Samples</h2>
              <div className="space-y-4">
                {modules.map((module: any) => (
                  <div key={module.id} className="border rounded-lg">
                    <button
                      className="w-full p-4 flex justify-between items-center text-left"
                      onClick={() => toggleModule(module.id)}
                    >
                      <span className="flex items-center">
                        <span className="text-gray-500 mr-4">
                          {String(module.order_no).padStart(2, "0")}
                        </span>
                        {module.title}
                      </span>
                      <span className={`transform transition-transform ${expandedModule === module.id ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </button>
                    {expandedModule === module.id && (
                      <ul className="p-4 pt-0 space-y-2 text-gray-600">
                        {module.sub_lessons?.map((sub: any) => (
                          <li key={sub.id} className="pl-12">• {sub.title}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right (Sidebar) */}
          <div className="md:col-span-1">
            <div className="sticky top-30 p-6 border rounded-lg bg-white z-10">
              <span className="text-orange-500">Course</span>
              <h1 className="text-2xl font-bold mb-2">{courses?.name}</h1>
              <p 
                className="text-gray-600 mb-4 overflow-hidden text-ellipsis break-words"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}    
              >
                {courses?.summary}</p>
              <p className="text-2xl font-bold mb-6">
                THB {courses?.price?.toLocaleString()}
              </p>

              {isAuthenticated ? (
                isSubscribed ? (
                  <Link href={`/course-learning/${courses?.id}/learning`} className="block w-full">
                    <ButtonT variant="primary" className="w-full py-1">
                      Start Learning
                    </ButtonT>
                  </Link>
                ) : (
                  <>
                    <ButtonT
                      variant="Secondary"
                      className="w-full mb-3"
                      onClick={() => setShowWishlistModal(true)}
                    >
                      {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    </ButtonT>
                    <ButtonT
                      variant="primary"
                      className="w-full"
                      onClick={() => setShowSubscribeModal(true)}
                    >
                      Subscribe This Course
                    </ButtonT>
                  </>
                )
              ) : (
                <>
                  <Link href={`/login?redirect=/course-detail/${courseId}`}>
                    <ButtonT variant="Secondary" className="block w-full mb-3 py-2">
                      Add to Wishlist
                    </ButtonT>
                  </Link>
                  <Link href={`/login?redirect=/course-detail/${courseId}`}>
                    <ButtonT variant="primary" className="block w-full py-2">
                      Subscribe This Course
                    </ButtonT>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {!isSubscribed && (
          <div className="mb-12">
            <hr />
            <h2 className="text-center text-2xl font-bold my-6">Other Interesting Courses</h2>
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-1 md:-ml-2">
                {otherCourses.map((course: any) => (
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
        )}
      </main>

      {/* Wishlist Modal */}
      <ConfirmModal
        isOpen={showWishlistModal}
        onClose={() => setShowWishlistModal(false)}
        onConfirm={async () => {
          setShowWishlistModal(false);
          if (!user || !courses) return;
          try {
            if (!isWishlisted) {
              const { error } = await supabase.from("wishlist").insert({
                user_id: user.user_id,
                course_id: courses.id,
                created_at: getBangkokISOString(),
              });
              if (error) throw error;
              setIsWishlisted(true);
              success("Added to Wishlist");
            } else {
              const { error } = await supabase
                .from("wishlist")
                .delete()
                .eq("user_id", user.user_id)
                .eq("course_id", courses.id);
              if (error) throw error;
              setIsWishlisted(false);
              success("Removed from Wishlist");
            }
          } catch (err: any) {
            console.error("Wishlist error:", err.message);
          }
        }}
        title="Wishlist Confirmation"
        message={
          isWishlisted
            ? `Do you want to remove ${courses?.name} from your Wishlist?`
            : `Do you want to add ${courses?.name} to your Wishlist?`
        }
        confirmText={isWishlisted ? "Remove" : "Add"}
        cancelText="Cancel"
        confirmButtonClass="bg-blue-600 text-white hover:bg-blue-700"
        cancelButtonClass="border border-orange-500 text-orange-500 hover:bg-orange-50"
      />

      {/* Subscribe Modal */}
      <ConfirmModal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        onConfirm={() => {
          setShowSubscribeModal(false);
          router.push(`/payment/${courses?.id}`);
        }}
        title="Confirmation"
        message={`Are you sure you want to subscribe to ${courses?.name} course?`}
        confirmText="Yes, I want to subscribe"
        cancelText="No, I don't"
        confirmButtonClass="bg-blue-600 text-white hover:bg-blue-700"
        cancelButtonClass="border border-orange-500 text-orange-500 hover:bg-orange-50"
      />

      {!isAuthenticated && <CallToAction />}
    </div>
  );
};

export default CourseDetailPage;
