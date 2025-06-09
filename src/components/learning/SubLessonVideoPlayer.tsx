"use client";
import { useRef, useEffect, useCallback, useState } from "react";
import { useLearning } from "./context/LearningContext";
import { useAuth } from "@/app/context/authContext";
import { useProgress } from "./context/ProgressContext";
import MuxPlayer from "@mux/mux-player-react";
import { Play } from "lucide-react";

interface ProgressData {
  watch_time: number;
  status: string;
  duration: number;
}

export default function LessonVideoPlayer() {
  const { currentLesson } = useLearning();
  const { user } = useAuth();
  const { refreshProgress, updateLessonStatus } = useProgress();
  const playerRef = useRef<any>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVisibilityChanged, setHasVisibilityChanged] = useState(false);
  const lastUpdateTime = useRef(0);
  const isFirstLoad = useRef(true);
  const currentLessonId = useRef<string | null>(null);
  const updateThrottleDelay = 5000;

  const fetchProgress = useCallback(async () => {
    if (!user || !currentLesson?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/progress/sub_lesson/${currentLesson.id}`);
      if (response.ok) {
        const data = await response.json();
        setProgressData({
          ...data,
          duration: data.duration || currentLesson.duration || 0
        });
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      if (!hasVisibilityChanged) {
        setIsLoading(false);
      }
    }
  }, [user, currentLesson?.id, currentLesson?.duration, hasVisibilityChanged]);

  const updateProgress = useCallback(async (watchTime: number, status?: string) => {
    if (!user || !currentLesson?.id) return;

    try {
      const videoDuration = playerRef.current?.duration;
      const payload: any = {
        watch_time: watchTime,
      };

      if (status) {
        payload.status = status;
      }

      if (videoDuration && videoDuration > 0) {
        payload.duration = videoDuration;
      }

      await fetch(`/api/progress/sub_lesson/${currentLesson.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  }, [user, currentLesson?.id]);

  const throttledUpdateProgress = useCallback((currentTime: number) => {
    const now = Date.now();
    if (now - lastUpdateTime.current >= updateThrottleDelay) {
      lastUpdateTime.current = now;
      if (progressData?.status !== 'completed') {
        updateProgress(currentTime);
      }
    }
  }, [updateProgress, progressData?.status]);

  const handleTimeUpdate = useCallback((event: any) => {
    const currentTime = event.target.currentTime;
    if (currentTime && currentTime > 0) {
      if (progressData?.status === 'not_started') {
        setProgressData(prev => prev ? { ...prev, status: 'in_progress' } : null);

        if (currentLesson?.id) {
          updateLessonStatus(currentLesson.id, 'in_progress');
        }

        updateProgress(currentTime, "in_progress");
      } else if (progressData?.status !== 'completed') {
        throttledUpdateProgress(currentTime);
      }
    }
  }, [throttledUpdateProgress, progressData?.status, updateProgress, updateLessonStatus, currentLesson?.id]);

  const handlePlay = useCallback(() => {
    const currentTime = playerRef.current?.currentTime || 0;
    if (progressData?.status !== 'completed') {
      setProgressData(prev => prev ? { ...prev, status: 'in_progress' } : null);

      if (currentLesson?.id) {
        updateLessonStatus(currentLesson.id, 'in_progress');
      }

      updateProgress(currentTime, "in_progress");
    }
  }, [updateProgress, progressData?.status, updateLessonStatus, currentLesson?.id]);

  const handlePause = useCallback(() => {
    const currentTime = playerRef.current?.currentTime || 0;
    if (progressData?.status !== 'completed') {
      updateProgress(currentTime);
    }
  }, [updateProgress, progressData?.status]);

  const handleSeeked = useCallback(() => {
    const currentTime = playerRef.current?.currentTime || 0;
    if (progressData?.status !== 'completed') {
      updateProgress(currentTime);
    }
  }, [updateProgress, progressData?.status]);

  const handleEnded = useCallback(async () => {
    const duration = playerRef.current?.duration || 0;
    setProgressData(prev => prev ? { ...prev, status: 'completed' } : null);

    if (currentLesson?.id) {
      updateLessonStatus(currentLesson.id, 'completed');
    }

    await updateProgress(duration, "completed");
  }, [updateProgress, updateLessonStatus, currentLesson?.id]);

  const handleLoadedMetadata = useCallback(() => {
    if (progressData?.watch_time && playerRef.current) {
      const resumeTime = progressData.watch_time;
      const duration = playerRef.current.duration || 0;

      if (duration > 0 && resumeTime < duration * 0.95) {
        playerRef.current.currentTime = resumeTime;
      }
    }
  }, [progressData?.watch_time]);

  useEffect(() => {
    if (currentLesson?.id && (currentLesson.id !== currentLessonId.current || isFirstLoad.current)) {
      
      if (!hasVisibilityChanged) {
        setIsLoading(true);
      }
      setProgressData(null);
      currentLessonId.current = currentLesson.id;
      isFirstLoad.current = false;

      fetchProgress();
    }
  }, [currentLesson?.id, fetchProgress, hasVisibilityChanged]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasVisibilityChanged) {
        setHasVisibilityChanged(false);
      } else if (document.visibilityState === 'hidden') {
        setHasVisibilityChanged(true);
        if (playerRef.current && progressData?.status !== 'completed') {
          const currentTime = playerRef.current.currentTime || 0;
          if (currentTime > 0) {
            updateProgress(currentTime);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasVisibilityChanged, updateProgress, progressData?.status]);

  if (!currentLesson?.video_url) {
    return (
      <div className="aspect-video flex items-center justify-center bg-gray-100 rounded-lg mb-6 text-sm text-gray-500">
        No video available for this lesson.
      </div>
    );
  }

  if (isLoading && !hasVisibilityChanged && currentLesson?.id === currentLessonId.current) {
    return (
      <div className="aspect-video flex items-center justify-center bg-gray-900 rounded-lg mb-6">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-sm">Loading video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {progressData?.watch_time && progressData.watch_time > 30 && progressData.status !== 'completed' ? (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Play className="h-4 w-4" />
            <span className="text-sm">
              You were at {Math.floor(progressData.watch_time / 60)}:
              {String(Math.floor(progressData.watch_time % 60)).padStart(2, '0')}.
              The video will resume from where you left off.
            </span>
          </div>
        </div>
      ) : null}

      <div
        id="lesson-video"
        className="aspect-video bg-black rounded-lg overflow-hidden scroll-mt-[88px]"
      >
        <MuxPlayer
          ref={playerRef}
          playbackId={currentLesson.video_url}
          accent-color="#3B82F6"
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeeked={handleSeeked}
          onEnded={handleEnded}
          onLoadedMetadata={handleLoadedMetadata}
        />
      </div>
    </div>
  );
}
