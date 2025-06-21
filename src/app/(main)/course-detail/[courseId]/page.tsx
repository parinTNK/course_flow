"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/context/authContext";
import { useCourseData } from "@/hooks/useCourseData";
import { useSubscription } from "@/hooks/useSubscription";
import { useWishlist } from "@/hooks/useWishlist";
import { useCustomToast } from "@/components/ui/CustomToast";
import { getBangkokISOString } from "@/lib/bangkokTime";

import CourseTrailerVideo from "@/components/course/CourseTrailerVideo";
import CourseDetailSection from "@/components/course/CourseDetailSection";
import CourseModules from "@/components/course/CourseModules";
import CourseAttachment from "@/components/course/CourseAttachment";
import CourseSidebar from "@/components/course/CourseSidebar";
import OtherCoursesCarousel from "@/components/course/OtherCoursesCarosel";
import WishlistModal from "@/components/course/modals/WishlistModal";
import SubscribeModal from "@/components/course/modals/SubscribeModal";

import LoadingSpinner from "@/app/admin/components/LoadingSpinner";
import CallToAction from "@/components/landing/CallToAction";

const CourseDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;

  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  const { course, modules, otherCourses, loading: isFetching } = useCourseData(courseId);

  const { success } = useCustomToast();

  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const isSubscribed = useSubscription(courseId, user?.user_id);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [isProcessingWishlist, setIsProcessingWishlist] = useState(false);
  const { isWishlisted, setIsWishlisted } = useWishlist(courseId, user?.user_id);


  const handleToggleWishlist = async () => {
    if (!course?.id || !user?.user_id) return;

    setIsProcessingWishlist(true);
    setShowWishlistModal(false);

    try {
      if (!isWishlisted) {
        const { error } = await supabase.from("wishlist").insert({
          user_id: user.user_id,
          course_id: course.id,
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
          .eq("course_id", course.id);
        if (error) throw error;
        setIsWishlisted(false);
        success("Removed from Wishlist");
      }
    } catch (err: any) {
      console.error("Wishlist error:", err.message);
    } finally {
      setIsProcessingWishlist(false);
    }
  };

  if (loading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (!course) {
  return <div className="text-center mt-32">Course not found.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto mt-20 px-4 py-8">
        <Link href="/our-courses" className="text-[#2F5FAC] font-bold mb-6 inline-flex items-center">
          <img src="/Left-Arrow.svg" alt="Back Button" className="mr-3" />
          <span>Back</span>
        </Link>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            <CourseTrailerVideo url={course?.video_trailer_url} />
            <CourseDetailSection detail={course?.detail} />

            {isAuthenticated && isSubscribed && (
              <CourseAttachment
                attachmentUrl={course?.attachment_url}
                courseName={course?.name}
              />
            )}

            <CourseModules modules={modules} />
          </div>

          <div className="md:col-span-1">
            <CourseSidebar
              isAuthenticated={isAuthenticated}
              isSubscribed={isSubscribed}
              isWishlisted={isWishlisted}
              courseId={course?.id}
              courseName={course?.name}
              summary={course?.summary}
              price={course?.price}
              onSubscribeClick={() => setShowSubscribeModal(true)}
              onWishlistClick={() => {
                if (!isProcessingWishlist) setShowWishlistModal(true);
              }}
            />
          </div>
        </div>

        {!isSubscribed && <OtherCoursesCarousel courses={otherCourses} />}
      </main>

      <WishlistModal
        isOpen={showWishlistModal}
        courseName={course?.name}
        isWishlisted={isWishlisted}
        onClose={() => setShowWishlistModal(false)}
        onConfirm={handleToggleWishlist}
      />

      <SubscribeModal
        isOpen={showSubscribeModal}
        courseName={course?.name}
        onClose={() => setShowSubscribeModal(false)}
        onConfirm={() => {
          setShowSubscribeModal(false);
          router.push(`/payment/${course?.id}`);
        }}
      />

      {!isAuthenticated && <CallToAction />}
    </div>
  );
};

export default CourseDetailPage;
