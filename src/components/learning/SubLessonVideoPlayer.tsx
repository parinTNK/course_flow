"use client";
import { useRef, useEffect, useCallback, useState } from "react";
import { useLearning } from "./context/LearningContext";
import { useAuth } from "@/app/context/authContext";
import { useProgress } from "./context/ProgressContext";
import { supabase } from "@/lib/supabaseClient";
import { getBangkokISOString } from "@/lib/bangkokTime";
import MuxPlayer from "@mux/mux-player-react";
import { Play } from "lucide-react";
import ConfirmationModal from "@/app/admin/components/ConfirmationModal";

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
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [initialWatchTime, setInitialWatchTime] = useState<number>(0);
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
        const progressInfo = {
          ...data,
          duration: data.duration || currentLesson.duration || 0
        };
        setProgressData(progressInfo);
        // บันทึกเวลาเริ่มต้นสำหรับตรวจสอบการ skip
        setInitialWatchTime(data.watch_time || 0);

        console.log("📊 PROGRESS DATA LOADED:");
        console.log("- lesson_id:", currentLesson.id);
        console.log("- watch_time:", data.watch_time);
        console.log("- status:", data.status);
        console.log("- duration:", progressInfo.duration);
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

  // Throttled progress update for timeupdate events
  const throttledUpdateProgress = useCallback((currentTime: number) => {
    const now = Date.now();
    if (now - lastUpdateTime.current >= updateThrottleDelay) {
      lastUpdateTime.current = now;
      // Don't update if already completed to prevent status change
      if (progressData?.status !== 'completed') {
        updateProgress(currentTime);
      }
    }
  }, [updateProgress, progressData?.status]);

  // Handle video player events
  const handleTimeUpdate = useCallback((event: any) => {
    const currentTime = event.target.currentTime;
    if (currentTime && currentTime > 0) {
      // เปลี่ยนเป็น in_progress ทันทีเมื่อเริ่มดู (ถ้ายังไม่ได้เป็น completed)
      if (progressData?.status === 'not_started') {
        setProgressData(prev => prev ? { ...prev, status: 'in_progress' } : null);

        // Update context immediately for sidebar
        if (currentLesson?.id) {
          updateLessonStatus(currentLesson.id, 'in_progress');
        }

        updateProgress(currentTime, "in_progress");
      } else if (progressData?.status !== 'completed') {
        // Only update progress if not completed
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

  // ฟังก์ชันตรวจสอบว่าควรแสดง modal หรือไม่
  const shouldShowCompletionModal = useCallback((watchTime: number, duration: number): boolean => {
    console.log("🔍 CHECKING MODAL CONDITIONS:");
    console.log("- initialWatchTime:", initialWatchTime);
    console.log("- watchTime:", watchTime);
    console.log("- duration:", duration);

    // **สำหรับทดสอบ: บังคับแสดง modal ถ้า initialWatchTime = 0 (วิดีโอใหม่)**
    if (initialWatchTime === 0) {
      console.log("🧪 TEST MODE: New video - Force showing modal for testing");
      return true;
    }

    // ถ้าเคยดูจบแล้ว (initialWatchTime >= duration * 0.95) ไม่ต้องแสดง modal
    if (initialWatchTime >= duration * 0.95) {
      console.log("✅ Previously completed video - No modal needed");
      return false;
    }

    // ถ้าเป็นการดูต่อ ตรวจสอบว่าดูเกิน 60% ของเวลาที่เหลือหรือไม่
    const remainingTime = duration - initialWatchTime;
    const watchedTime = watchTime - initialWatchTime;

    console.log("- remainingTime:", remainingTime);
    console.log("- watchedTime:", watchedTime);

    if (remainingTime <= 0) {
      console.log("⚠️ No remaining time - No modal needed");
      return false;
    }

    const watchPercentage = (watchedTime / remainingTime) * 100;
    console.log("- watchPercentage:", watchPercentage.toFixed(2) + "%");

    const shouldShow = watchPercentage < 60;
    console.log("- Result: Should show modal?", shouldShow);

    return shouldShow;
  }, [initialWatchTime]);

  // ฟังก์ชันสำหรับ mark lesson เป็น completed
  const completeLesson = useCallback(async (duration: number) => {
    setProgressData(prev => prev ? { ...prev, status: 'completed' } : null);

    if (currentLesson?.id) {
      updateLessonStatus(currentLesson.id, 'completed');
    }

    await updateProgress(duration, "completed");
  }, [updateProgress, updateLessonStatus, currentLesson?.id]);

  const handleEnded = useCallback(async () => {
    const duration = playerRef.current?.duration || 0;
    const currentWatchTime = playerRef.current?.currentTime || duration;

    console.log("🎬 VIDEO ENDED DEBUG:");
    console.log("- duration:", duration);
    console.log("- currentWatchTime:", currentWatchTime);
    console.log("- initialWatchTime:", initialWatchTime);

    // ตรวจสอบว่าควรแสดง modal หรือไม่
    const shouldShowModal = shouldShowCompletionModal(currentWatchTime, duration);

    console.log("- shouldShowModal:", shouldShowModal);

    if (shouldShowModal) {
      console.log("✅ Showing completion modal");
      setShowCompletionModal(true);
    } else {
      console.log("❌ No modal - marking as completed");
      // ถ้าไม่ต้องแสดง modal ให้ mark เป็น completed ทันที
      await completeLesson(duration);
    }
  }, [shouldShowCompletionModal, completeLesson, initialWatchTime]);

  // ฟังก์ชันจัดการเมื่อผู้ใช้เลือก "เข้าใจแล้ว"
  const handleUnderstood = useCallback(async () => {
    const duration = playerRef.current?.duration || 0;
    setShowCompletionModal(false);
    await completeLesson(duration);
  }, [completeLesson]);

  // ฟังก์ชันจัดการเมื่อปิด modal (ไม่เข้าใจ)
  const handleModalClose = useCallback(async () => {
    setShowCompletionModal(false);

    // Reset video และ status เป็น in_progress (ดูอีกครั้ง)
    if (playerRef.current) {
      playerRef.current.currentTime = initialWatchTime;
    }

    setProgressData(prev => prev ? { ...prev, status: 'in_progress' } : null);

    if (currentLesson?.id) {
      updateLessonStatus(currentLesson.id, 'in_progress');
    }

    await updateProgress(initialWatchTime, "in_progress");
  }, [initialWatchTime, updateProgress, updateLessonStatus, currentLesson?.id]);

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
      console.log("🎥 Video Player: Fetching progress for lesson:", currentLesson.id);

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
          You last watched up to {Math.floor(progressData.watch_time / 60)}:
          {String(Math.floor(progressData.watch_time % 60)).padStart(2, '0')}.
          We'll resume the video from there for you.
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

      <ConfirmationModal
      isOpen={showCompletionModal}
      onClose={handleModalClose}
      onConfirm={handleUnderstood}
      title="Continue Anyway"
      message={
        <>
          {/* {currentLesson?.title && (
            <>
              You’ve reached the end of <strong>"{currentLesson.title}"</strong>.
              <br />
            </>
          )} */}
          Are you confident you understand this lesson?
        </>
      }
      confirmText="Yes, I understand"
      cancelText="No, let me watch again"
      confirmButtonClass="bg-white border border-orange-500 text-orange-500 hover:bg-orange-50 cursor-pointer"
      cancelButtonClass="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
      />
    </div>
  );
}
