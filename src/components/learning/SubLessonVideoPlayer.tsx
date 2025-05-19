"use client";
import { useRef } from "react";
import { useLearning } from "./context/LearningContext";
import { useAuth } from "@/app/context/authContext";
import { useProgress } from "./context/ProgressContext";
import { supabase } from "@/lib/supabaseClient";

export default function LessonVideoPlayer() {
  const { currentLesson } = useLearning();
  const { user } = useAuth();
  const { refreshProgress } = useProgress();
  const videoRef = useRef<HTMLVideoElement>(null);

  const updateWatchStatus = async (status: "in_progress" | "completed") => {
    if (!user || !currentLesson?.id) return;

    await supabase.from("lesson_progress").upsert(
      {
        user_id: user.user_id,
        sub_lesson_id: currentLesson.id,
        status,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,sub_lesson_id",
      }
    );

    if (status === "completed") {
      refreshProgress(); // 🔁 trigger Sidebar reload
    }
  };

  if (!currentLesson?.video_url) {
    return (
      <div className="aspect-video flex items-center justify-center bg-gray-100 rounded-lg mb-6 text-sm text-gray-500">
        No video available for this lesson.
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
      <video
        ref={videoRef}
        controls
        className="w-full h-full"
        onPlay={() => updateWatchStatus("in_progress")}
        onEnded={() => updateWatchStatus("completed")}
      >
        <source src={currentLesson.video_url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
