"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ButtonT } from "@/components/ui/ButtonT";
import { supabase } from "@/lib/supabaseClient";
import BackgroundSVGs from "@/components/BackgroundSVGs";
import { useAuth } from "@/app/context/authContext";

export default function PaymentCompletedPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const { user } = useAuth(); 

 
  useEffect(() => {
    const removeFromWishlist = async () => {
      if (!user) return; 

      const { error } = await supabase
        .from("wishlist")
        .delete()
        .match({ user_id: user.user_id, course_id: courseId }); 

      if (error) {
        console.error("Failed to remove wishlist after payment:", error.message);
      } else {
        console.log("Removed course from wishlist after payment.");
      }
    };

    if (courseId && user) {
      removeFromWishlist();
    }
  }, [courseId, user]); 

  return (
    <div className="flex items-center justify-center md:mt-60 mt-30 mb-10">
      <BackgroundSVGs />
      <div className="bg-white rounded-2xl shadow-lg px-10 py-10 md:max-w-1/2 mx-4 w-full flex flex-col items-center">
        <div className="flex flex-col items-center gap-5 mb-6">
          <img
            src="/payment-completed.svg"
            alt="payment successfully"
            className="w-[65px] h-[65px]"
          />
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
              Thank you for subscribing.
            </h2>
            <p className="text-gray-500 mb-8 text-center">
              Your payment is complete. You can start learning the course now.
            </p>
          </div>
        </div>
        <div className="flex md:flex-row flex-col gap-4 justify-center w-full">
          <ButtonT
            variant="Secondary"
            className="w-full cursor-pointer"
            onClick={() => router.push(`/course-detail/${courseId}`)}
          >
            View Course Detail
          </ButtonT>
          <ButtonT
            variant="primary"
            className="w-full cursor-pointer"
            onClick={() => router.push(`/course-learning/${courseId}`)}
          >
            Start Learning
          </ButtonT>
        </div>
      </div>
    </div>
  );
}
