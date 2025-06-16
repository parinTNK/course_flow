"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ButtonT } from "@/components/ui/ButtonT";

type Props = {
  isAuthenticated: boolean;
  isSubscribed: boolean;
  isWishlisted: boolean;
  courseId: string;
  courseName?: string;
  summary?: string;
  price?: number;
  onSubscribeClick: () => void;
  onWishlistClick: () => void;
};

export default function CourseSidebar({
  isAuthenticated,
  isSubscribed,
  isWishlisted,
  courseId,
  courseName,
  summary,
  price,
  onSubscribeClick,
  onWishlistClick,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSummary = () => setIsExpanded((prev) => !prev);

  return (
    <div className="sticky top-30 p-6 border rounded-lg bg-white z-10">
      <span className="text-orange-500 text-sm">Course</span>
      <h1 className="text-xl sm:text-2xl font-bold mb-2">
        {courseName || "Course Name"}
      </h1>

      <div className="text-gray-600 text-[12px] sm:text-base break-words mb-2">
        <p className={isExpanded ? "" : "line-clamp-2"}>
          {summary || "No summary available."}
        </p>
        {summary && summary.length > 80 && (
          <button
            onClick={toggleSummary}
            className="text-blue-500 text-xs sm:text-sm mt-1 cursor-pointer"
          >
            {isExpanded ? "Read less" : "Read more"}
          </button>
        )}
      </div>

      <p className="text-xl sm:text-2xl font-bold mb-6">
        {typeof price === "number"
          ? `THB ${price.toLocaleString()}`
          : "Loading..."}
      </p>

      {isAuthenticated ? (
        isSubscribed ? (
          <Link href={`/course-learning/${courseId}`} className="block w-full">
            <ButtonT variant="primary" className="w-full py-1">
              Start Learning
            </ButtonT>
          </Link>
        ) : (
          <>
            <ButtonT
              variant="Secondary"
              className="w-full mb-3"
              onClick={onWishlistClick}
              aria-label={
                isWishlisted ? "Remove from wishlist" : "Add to wishlist"
              }
            >
              {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            </ButtonT>
            <ButtonT
              variant="primary"
              className="w-full"
              onClick={onSubscribeClick}
              aria-label="Subscribe to course"
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
  );
}
