import React from "react";
import { VideoOff } from "lucide-react";

type Props = {
  url?: string;
};

export default function CourseTrailerVideo({ url }: Props) {
  const commonClass = "w-full h-[400px] bg-gray-200 rounded-lg";

  if (!url) {
    return (
      <div className={`${commonClass} flex items-center justify-center text-gray-500 text-sm`}>
        <VideoOff className="w-10 h-10 mb-2" />
        <span>Video not found</span>
      </div>
    );
  }

  return (
    <video className={commonClass} controls>
      <source src={url} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}
