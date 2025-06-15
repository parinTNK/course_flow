"use client";

import React from "react";
import { BookOpen, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Bundle } from "@/types/bundle";

type BundleCardProps = {
  bundle: Bundle;
};

const BundleCard: React.FC<BundleCardProps> = ({ bundle }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/bundle-detail/${bundle.id}`);
  };

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer w-full max-w-4xl"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      <div className="flex gap-15">
        {/* รูปภาพ */}
        <div className="w-55 h-55 overflow-hidden flex-shrink-0 rounded-lg">
          {bundle.image_url ? (
            <img
              src={bundle.image_url}
              alt={bundle.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
              No Image
            </div>
          )}
        </div>

        {/* เนื้อหา */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Header */}
          <div>
            <span className="text-sm text-orange-500 font-medium  py-1 rounded inline-block">
              Bundle Package
            </span>
            <h3 className="text-lg font-semibold text-gray-900 m-2t mb-1">
              {bundle.name}
            </h3>
            <p className="text-gray-600 text-sm mt-5 line-clamp-2">
              {bundle.description}
            </p>
          </div>

          {/* Footer - Price and Info */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-6">
            <div className="flex items-center space-x-4 text-sm text-gray-500"></div>
          </div>

          {/* Course List */}
          <div className="mb-10">
            <p className="text-sm text-blue-500">
              Service Design Essentials, UX/UI Design Beginner, Product Design
              for Business
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BundleCard;
