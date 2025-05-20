"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LearningProvider } from "@/components/learning/context/LearningContext";
import Sidebar from "@/components/learning/Sidebar";
import LessonContent from "@/components/learning/LessonContent";
import Assignment from "@/components/learning/Assignment";
import LoadingSpinner from "@/app/admin/components/LoadingSpinner";
import { useLearning } from "@/components/learning/context/LearningContext";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ProgressProvider } from "@/components/learning/context/ProgressContext";
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

function CourseContent() {
  const router = useRouter();
  const { courseId } = useParams();
  const { currentLesson, setCurrentLesson } = useLearning();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const scrollToLessonSection = () => {
    const checkAndScroll = () => {
      const el = document.getElementById("lesson-section");
      if (!el) return;

      const rect = el.getBoundingClientRect();
      if (rect.height < 100) {
        setTimeout(checkAndScroll, 100);
      } else {
        const yOffset = -128;
        const y = rect.top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    };

    setTimeout(checkAndScroll, 50);
  };

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: subscription, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single();

        if (error || !subscription) {
          router.push(`/course-detail/${courseId}`);
          return;
        }

        setIsSubscribed(true);
        setLoading(false);
      } catch (error) {
        console.error('Error checking subscription:', error);
        router.push(`/course-detail/${courseId}`);
      }
    };

    checkSubscription();
  }, []);

  useEffect(() => {
    if (!currentLesson && lessons.length > 0) {
      setCurrentLesson(lessons[0]?.sub_lessons[0]);
    }
  }, [lessons, currentLesson, setCurrentLesson]);

  useEffect(() => {
    if (currentLesson) {
      scrollToLessonSection();
    }
  }, [currentLesson?.id]);

  const findSubLessonIndex = () => {
    for (let lesson of lessons) {
      const index = lesson.sub_lessons.findIndex(sl => sl.id === currentLesson?.id);
      if (index !== -1) {
        return { lesson, index };
      }
    }
    return null;
  };

  const handlePrev = () => {
    if (isFirstSubLesson()) return;
    const found = findSubLessonIndex();
    if (!found) return;
    const { lesson, index } = found;

    if (index > 0) {
      setCurrentLesson(lesson.sub_lessons[index - 1]);
      scrollToLessonSection();
    } else {
      const currentLessonIndex = lessons.findIndex(l => l.id === lesson.id);
      if (currentLessonIndex > 0) {
        const prevLesson = lessons[currentLessonIndex - 1];
        setCurrentLesson(prevLesson.sub_lessons[prevLesson.sub_lessons.length - 1]);
        scrollToLessonSection();
      }
    }
  };

  const handleNext = () => {
    if (isLastSubLesson()) return;
    const found = findSubLessonIndex();
    if (!found) return;
    const { lesson, index } = found;

    if (index < lesson.sub_lessons.length - 1) {
      setCurrentLesson(lesson.sub_lessons[index + 1]);
      scrollToLessonSection();
    } else {
      const currentLessonIndex = lessons.findIndex(l => l.id === lesson.id);
      if (currentLessonIndex < lessons.length - 1) {
        const nextLesson = lessons[currentLessonIndex + 1];
        setCurrentLesson(nextLesson.sub_lessons[0]);
        scrollToLessonSection();
      }
    }
  };

  const isFirstSubLesson = () => {
    const found = findSubLessonIndex();
    if (!found) return true;
    const { lesson, index } = found;
    const lessonIndex = lessons.findIndex(l => l.id === lesson.id);
    return index === 0 && lessonIndex === 0;
  };

  const isLastSubLesson = () => {
    const found = findSubLessonIndex();
    if (!found) return true;
    const { lesson, index } = found;
    const lessonIndex = lessons.findIndex(l => l.id === lesson.id);
    return index === lesson.sub_lessons.length - 1 && lessonIndex === lessons.length - 1;
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <LoadingSpinner />
    </div>;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 pt-24 md:pt-32 pb-10 max-w-screen-xl mx-auto px-4">
      <div className="md:sticky md:top-16 md:w-[260px] w-full mb-4 md:mb-0">
        <Sidebar setLessons={setLessons} scrollToVideo={scrollToLessonSection} />
      </div>

      <main className="flex-1 w-full md:p-6 md:max-w-[calc(100%-280px)]">
        <div id="lesson-section">
          <h1 className="text-2xl font-bold mb-6">
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
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
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
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </ButtonT>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CourseLearningPage() {
  return (
    <LearningProvider>
      <ProgressProvider>
        <CourseContent />
      </ProgressProvider>
    </LearningProvider>
  );
}
