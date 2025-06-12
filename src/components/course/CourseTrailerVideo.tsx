import React from "react";
import { VideoOff } from "lucide-react";
import MuxPlayer from "@mux/mux-player-react";

type Props = {
  url?: string;
};

export default function CourseTrailerVideo({ url }: Props) {
  if (!url) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500 text-sm gap-2 mb-6">
        <VideoOff className="w-10 h-10" />
        <span>Video not found</span>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden mb-6">
      <MuxPlayer
        playbackId={url}
        accent-color="#3B82F6"
        className="w-full h-full"
      />
    </div>
  );
}
