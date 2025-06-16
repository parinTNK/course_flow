"use client";

import { useEffect, useState, useCallback } from "react";

declare global {
  interface Window {
    __draftAnswers?: Record<string, any>;
  }
}
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLearning } from "@/components/learning/context/LearningContext";
import { useDraft } from "@/app/context/draftContext";
import { useAuth } from "@/app/context/authContext";
import { supabase } from "@/lib/supabaseClient";

import Sidebar from "@/components/learning/Sidebar";
import LessonContent from "@/components/learning/LessonContent";
import Assignment from "@/components/learning/Assignment";
import LoadingSpinner from "@/app/admin/components/LoadingSpinner";
import LessonVideoPlayer from "@/components/learning/SubLessonVideoPlayer";
import { ButtonT } from "@/components/ui/ButtonT";

interface SubLesson {
  id: string;
  title: string;
  video_url: string;
  order_no: number;
  is_completed?: boolean;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  order_no: number;
  sub_lessons: SubLesson[];
}

export default function CourseContent() {
  const router = useRouter();
  const { courseId } = useParams();
  const searchParams = useSearchParams();
  const subLessonId = searchParams.get("subLessonId");
  const { currentLesson, setCurrentLesson } = useLearning();
  const { dirtyAssignments, clearDrafts } = useDraft();
  const { user } = useAuth();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isAutoResumeComplete, setIsAutoResumeComplete] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingNavDirection, setPendingNavDirection] = useState<"prev" | "next" | null>(null);

  const scrollToLessonSection = () => {
    const el = document.getElementById("lesson-section");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.height < 100) {
      setTimeout(scrollToLessonSection, 100);
    } else {
      const yOffset = -128;
      const y = rect.top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const checkSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .single();
      if (error || !data) return router.push(`/course-detail/${courseId}`);
      setIsSubscribed(true);
      setLoading(false);
    };
    checkSubscription();
  }, []);

  const loadInitialLesson = useCallback(async () => {
    if (lessons.length === 0) return;
    if (isAutoResumeComplete) return;
    if (subLessonId) {
      for (let lesson of lessons) {
        const found = lesson.sub_lessons.find(sl => sl.id === subLessonId);
        if (found) {
          setCurrentLesson(found);
          setIsAutoResumeComplete(true);
          return;
        }
      }
    }
    try {
      const response = await fetch(`/api/progress/course/${courseId}/latest`);
      if (response.ok) {
        const data = await response.json();
        if (data.hasProgress && data.latestSubLesson) {
          for (let lesson of lessons) {
            const found = lesson.sub_lessons.find(sl => sl.id === data.latestSubLesson.id);
            if (found) {
              setCurrentLesson(found);
              if (!subLessonId) {
                router.replace(`/course-learning/${courseId}?subLessonId=${found.id}`);
              }
              setIsAutoResumeComplete(true);
              return;
            }
          }
        }
      }
    } catch {}
    if (lessons[0]?.sub_lessons[0]) {
      setCurrentLesson(lessons[0].sub_lessons[0]);
      if (!subLessonId) {
        router.replace(`/course-learning/${courseId}?subLessonId=${lessons[0].sub_lessons[0].id}`);
      }
      setIsAutoResumeComplete(true);
    }
  }, [lessons, subLessonId, courseId, router, setCurrentLesson, isAutoResumeComplete]);

  useEffect(() => {
    loadInitialLesson();
  }, [loadInitialLesson]);

  useEffect(() => {
    setIsAutoResumeComplete(false);
  }, [courseId, subLessonId]);

  useEffect(() => {
    if (currentLesson) scrollToLessonSection();
  }, [currentLesson?.id]);

  const findSubLessonIndex = () => {
    for (let lesson of lessons) {
      const index = lesson.sub_lessons.findIndex(
        (sl) => sl.id === currentLesson?.id
      );
      if (index !== -1) return { lesson, index };
    }
    return null;
  };

  const goToPrevLesson = () => {
    const found = findSubLessonIndex();
    if (!found) return;
    const { lesson, index } = found;
    let nextSubLesson;
    if (index > 0) {
      nextSubLesson = lesson.sub_lessons[index - 1];
    } else {
      const currentLessonIndex = lessons.findIndex((l) => l.id === lesson.id);
      if (currentLessonIndex > 0) {
        const prevLesson = lessons[currentLessonIndex - 1];
        nextSubLesson = prevLesson.sub_lessons[prevLesson.sub_lessons.length - 1];
      }
    }
    if (nextSubLesson) {
      setCurrentLesson(nextSubLesson);
      
      // Update URL without page reload using History API
      const newUrl = `/course-learning/${courseId}?subLessonId=${nextSubLesson.id}`;
      window.history.replaceState(
        { ...window.history.state, as: newUrl, url: newUrl },
        '',
        newUrl
      );
    }
    scrollToLessonSection();
  };

  const goToNextLesson = () => {
    const found = findSubLessonIndex();
    if (!found) return;
    const { lesson, index } = found;
    let nextSubLesson;
    if (index < lesson.sub_lessons.length - 1) {
      nextSubLesson = lesson.sub_lessons[index + 1];
    } else {
      const currentLessonIndex = lessons.findIndex((l) => l.id === lesson.id);
      if (currentLessonIndex < lessons.length - 1) {
        const nextLesson = lessons[currentLessonIndex + 1];
        nextSubLesson = nextLesson.sub_lessons[0];
      }
    }
    if (nextSubLesson) {
      setCurrentLesson(nextSubLesson);
      
      // Update URL without page reload using History API
      const newUrl = `/course-learning/${courseId}?subLessonId=${nextSubLesson.id}`;
      window.history.replaceState(
        { ...window.history.state, as: newUrl, url: newUrl },
        '',
        newUrl
      );
    }
    scrollToLessonSection();
  };

  const isFirstSubLesson = () => {
    const found = findSubLessonIndex();
    if (!found) return true;
    const { lesson, index } = found;
    const lessonIndex = lessons.findIndex((l) => l.id === lesson.id);
    return index === 0 && lessonIndex === 0;
  };

  const isLastSubLesson = () => {
    const found = findSubLessonIndex();
    if (!found) return true;
    const { lesson, index } = found;
    const lessonIndex = lessons.findIndex((l) => l.id === lesson.id);
    return (
      index === lesson.sub_lessons.length - 1 &&
      lessonIndex === lessons.length - 1
    );
  };

  const handleDraftConfirm = useCallback(async () => {
    if (
      window.__draftAnswers &&
      Object.keys(window.__draftAnswers).length > 0
    ) {
      const dirtyDrafts = window.__draftAnswers;
      const savePromises = Object.entries(dirtyDrafts).map(
        async ([assignmentId, answer]) => {
          await fetch(
            `/api/submission?assignmentId=${assignmentId}&userId=${user.user_id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answer, status: "inprogress" }),
            }
          );
        }
      );
      await Promise.all(savePromises);
    }
    clearDrafts();
    if (pendingNavDirection === "prev") goToPrevLesson();
    else if (pendingNavDirection === "next") goToNextLesson();
    setPendingNavDirection(null);
  }, [user?.id, pendingNavDirection, goToPrevLesson, goToNextLesson]);

  const handleDraftDiscard = useCallback(() => {
    setPendingNavDirection(null);
  }, []);

  const handlePrev = () => {
    if (isFirstSubLesson()) return;
    if (dirtyAssignments.size > 0) {
      setPendingNavDirection("prev");
    } else {
      goToPrevLesson();
    }
  };

  const handleNext = () => {
    if (isLastSubLesson()) return;
    if (dirtyAssignments.size > 0) {
      setPendingNavDirection("next");
    } else {
      goToNextLesson();
    }
  };

  if (loading || (!isAutoResumeComplete && lessons.length > 0)) {
    // const loadingMessage = !isAutoResumeComplete && lessons.length > 0 
    //   ? "Loading your progress..." 
    //   : "Loading course...";
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <LoadingSpinner />
        {/* <p className="mt-4 text-gray-600">{loadingMessage}</p> */}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 pt-24 md:pt-32 pb-10 max-w-screen-xl mx-auto px-4">
      <div className="md:sticky md:top-16 md:w-[260px] w-full mb-4 md:mb-0">
        <Sidebar
          setLessons={setLessons}
          scrollToVideo={scrollToLessonSection}
          isAutoResumeComplete={isAutoResumeComplete}
        />
      </div>

      <main className="flex-1 w-full md:p-6 md:max-w-[calc(100%-280px)]">
        <div id="lesson-section">
          <h1 className="text-2xl sm:text-4xl font-bold mb-6">
            {currentLesson?.title || lessons[0]?.sub_lessons[0]?.title}
          </h1>
          <LessonVideoPlayer />
        </div>

        <LessonContent />
        <Assignment />

        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-4 border-t border-gray-200 w-full">
          <button
            className="px-4 py-2 rounded-lg text-[#2F5FAC] font-semibold hover:text-blue-600 transition-colors w-full sm:w-auto sm:self-start disabled:opacity-50"
            onClick={handlePrev}
            disabled={isFirstSubLesson()}
          >
            <div className="flex items-center justify-center cursor-pointer">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
              Previous Lesson
            </div>
          </button>

          <div className="w-full sm:w-auto sm:self-end">
            <ButtonT
              variant="primary"
              className="w-full sm:w-auto justify-center disabled:opacity-50"
              onClick={handleNext}
              disabled={isLastSubLesson()}
            >
              <div className="flex items-center justify-center">
                Next Lesson
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </div>
            </ButtonT>
          </div>
        </div>
      </main>
    </div>
  );
}
