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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    const found = findSubLessonIndex();
    if (!found) return;
    const { lesson, index } = found;
    if (index > 0) {
      setCurrentLesson(lesson.sub_lessons[index - 1]);
    } else {
      const currentLessonIndex = lessons.findIndex(l => l.id === lesson.id);
      if (currentLessonIndex > 0) {
        const prevLesson = lessons[currentLessonIndex - 1];
        setCurrentLesson(prevLesson.sub_lessons[prevLesson.sub_lessons.length - 1]);
      }
    }
  };

  const handleNext = () => {
    const found = findSubLessonIndex();
    if (!found) return;
    const { lesson, index } = found;
    if (index < lesson.sub_lessons.length - 1) {
      setCurrentLesson(lesson.sub_lessons[index + 1]);
    } else {
      const currentLessonIndex = lessons.findIndex(l => l.id === lesson.id);
      if (currentLessonIndex < lessons.length - 1) {
        const nextLesson = lessons[currentLessonIndex + 1];
        setCurrentLesson(nextLesson.sub_lessons[0]);
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
    <div className="flex min-h-screen bg-gray-50 pt-44 max-w-screen-xl mx-auto px-4">
      <div className="sticky top-16">
        <Sidebar setLessons={setLessons} />
      </div>

      <main className="flex-1 p-6 max-w-[calc(100%-280px)] transition-all duration-500 ease-in-out">
        <h1 className="text-2xl font-bold mb-6">
          {currentLesson?.title || (lessons[0]?.sub_lessons[0]?.title)}
        </h1>

        <LessonVideoPlayer />
        <LessonContent />
        <Assignment />

        <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
          <button
            className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            onClick={handlePrev}
            disabled={isFirstSubLesson()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Previous Lesson
          </button>

          <button
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            onClick={handleNext}
            disabled={isLastSubLesson()}
          >
            Next Lesson
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
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
