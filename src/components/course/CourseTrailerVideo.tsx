import { VideoOff } from "lucide-react";
import React from "react";

interface CourseTrailerVideoProps {
    videoUrl: string | undefined;
}

export const CourseTrailerVideo: React.FC<CourseTrailerVideoProps> = ({ videoUrl }) => {
    return (
        videoUrl ? (
            <video 
                className="relative w-full h-[400px] bg-gray-200 rounded-lg overflow-hidden"
                controls
            >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        ) : (
            <div className="flex items-center justify-center w-full h-[400px] bg-gray-200 rounded-lg text-gray-500 text-sm">
                <VideoOff className="w-10 h-10 mb-2" />
                <span>Video not found</span>
            </div>
        )
    );
};