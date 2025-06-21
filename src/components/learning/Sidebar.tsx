"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { useLearning } from "./context/LearningContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import { useProgress } from "./context/ProgressContext";
import { ChevronDownIcon } from "lucide-react";
import ProgressIcon from "./ProgressIcon";
import LoadingSpinner from "@/app/admin/components/LoadingSpinner";

type WatchStatus = "not_started" | "in_progress" | "completed";

interface SubLesson {
  id: string;
  title: string;
  video_url: string;
  order_no: number;
  watch_status?: WatchStatus;
  mux_asset_id?: string;
  is_ready?: boolean;
  duration?: number;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  order_no: number;
  sub_lessons: SubLesson[];
}

interface SidebarProps {
  setLessons: (lessons: Lesson[]) => void;
  scrollToVideo: () => void;
  isAutoResumeComplete?: boolean;
}

export default function Sidebar({ setLessons: setParentLessons, scrollToVideo, isAutoResumeComplete = false }: SidebarProps) {
  const { courseId } = useParams();
  const { currentLesson, setCurrentLesson } = useLearning();
  const [loading, setLoading] = useState(true);
  const [localLessons, setLocalLessons] = useState<Lesson[]>([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { progressUpdated, lessonStatusUpdates } = useProgress();

  const getStatusIcon = (subLesson: SubLesson) => {
    const immediateStatus = lessonStatusUpdates[subLesson.id];
    const status = immediateStatus || subLesson.watch_status || "not_started";
    return <ProgressIcon status={status as WatchStatus} size={20} />;
  };

  useEffect(() => {
    const fetchCourseAndLessons = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: courseData } = await supabase
          .from('courses')
          .select('id, name, summary')
          .eq('id', courseId)
          .single();

        setCourseTitle(courseData.name);
        setCourseDescription(courseData.summary);

        const { data: lessonData } = await supabase
          .from('lessons')
          .select(`
            id,
            course_id,
            title,
            order_no,
            sub_lessons (
              id,
              title,
              video_url,
              order_no,
              mux_asset_id,
              is_ready,
              duration
            )
          `)
          .eq('course_id', courseId)
          .order('order_no');

        const sortedLessons = lessonData.map(lesson => ({
          ...lesson,
          sub_lessons: lesson.sub_lessons.sort((a, b) => a.order_no - b.order_no),
        }));

        const { data: progressData } = await supabase
          .from("sub_lesson_progress")
          .select("sub_lesson_id, status, watch_time")
          .eq("user_id", user.id);

        const lessonsWithStatus = sortedLessons.map(lesson => ({
          ...lesson,
          sub_lessons: lesson.sub_lessons.map(sub => {
            const match = progressData?.find(p => p.sub_lesson_id === sub.id);
            return {
              ...sub,
              watch_status: match?.status || "not_started",
            };
          }),
        }));

        setLocalLessons(lessonsWithStatus);
        setParentLessons(lessonsWithStatus);
        console.log("📚 Sidebar: Lessons loaded and passed to parent:", lessonsWithStatus.length, "lessons");

        const allSubLessons = lessonsWithStatus.flatMap(l => l.sub_lessons);
        const completedCount = allSubLessons.filter(s => s.watch_status === "completed").length;
        setCourseProgress(Math.round((completedCount / allSubLessons.length) * 100));

        setLoading(false);
      } catch (error) {
        console.error("Error loading course content:", error);
      }
    };

    fetchCourseAndLessons();
  }, [courseId, setParentLessons]);

  useEffect(() => {
    if (progressUpdated && localLessons.length > 0) {
      const updateProgressOnly = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: progressData } = await supabase
            .from("sub_lesson_progress")
            .select("sub_lesson_id, status, watch_time")
            .eq("user_id", user.id);

          const updatedLessons = localLessons.map(lesson => ({
            ...lesson,
            sub_lessons: lesson.sub_lessons.map(sub => {
              const match = progressData?.find(p => p.sub_lesson_id === sub.id);
              return {
                ...sub,
                watch_status: match?.status || "not_started",
              };
            }),
          }));

          setLocalLessons(updatedLessons);
          setParentLessons(updatedLessons);

          const allSubLessons = updatedLessons.flatMap(l => l.sub_lessons);
          const completedCount = allSubLessons.filter(sub => {
            const immediateStatus = lessonStatusUpdates[sub.id];
            const status = immediateStatus || sub.watch_status;
            return status === "completed";
          }).length;
          setCourseProgress(Math.round((completedCount / allSubLessons.length) * 100));

        } catch (error) {
          console.error("Error updating progress:", error);
        }
      };

      updateProgressOnly();
    }
  }, [progressUpdated, localLessons.length, setParentLessons]);

  useEffect(() => {
    if (localLessons.length > 0) {
      const allSubLessons = localLessons.flatMap(l => l.sub_lessons);
      const completedCount = allSubLessons.filter(sub => {
        const immediateStatus = lessonStatusUpdates[sub.id];
        const status = immediateStatus || sub.watch_status;
        return status === "completed";
      }).length;
      setCourseProgress(Math.round((completedCount / allSubLessons.length) * 100));
    }
  }, [lessonStatusUpdates, localLessons]);


  useEffect(() => {
    if (currentLesson && localLessons.length > 0 && isAutoResumeComplete) {
      console.log("🎯 Auto-expanding accordion for lesson:", currentLesson.title);
      const parentLesson = localLessons.find(lesson => 
        lesson.sub_lessons.some(sub => sub.id === currentLesson.id)
      );
      
      if (parentLesson && !expandedSections.includes(parentLesson.id)) {
        console.log("📂 Expanding section:", parentLesson.title);
        setExpandedSections(prev => [...prev, parentLesson.id]);
      }
    }
  }, [currentLesson, localLessons, expandedSections, isAutoResumeComplete]);

  const router = useRouter();

  const handleSubLessonClick = (subLesson: SubLesson) => {
    if (currentLesson?.id === subLesson.id) {
      scrollToVideo();
      return;
    }

    setCurrentLesson(subLesson);

    const newUrl = `/course-learning/${courseId}?subLessonId=${subLesson.id}`;
    window.history.replaceState(
      { ...window.history.state, as: newUrl, url: newUrl },
      '',
      newUrl
    );

    setTimeout(() => {
      scrollToVideo();
    }, 50);
  };

  if (loading) {
    return (
      <div className="w-full md:w-64 bg-white border-r p-4 md:min-h-screen">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <LoadingSpinner size="md" />
            <p className="text-sm text-gray-500 mt-2">Loading course content...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-64 bg-white border-r p-4 md:min-h-screen">
      <div className="mb-6">
        <span className="text-sm text-orange-500">Course</span>
        <h2 className="text-lg font-bold mb-2">{courseTitle}</h2>
        <p className="text-sm text-gray-500 mb-4">{courseDescription}</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${courseProgress}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{courseProgress}% Complete</span>
      </div>

      <Accordion.Root 
        type="multiple" 
        className="space-y-2"
        value={expandedSections}
        onValueChange={setExpandedSections}
      >
        {localLessons.map((lesson, index) => (
          <Accordion.Item key={lesson.id} value={lesson.id} className="border-b pb-2">
            <Accordion.Header>
              <Accordion.Trigger className="flex justify-between items-center w-full py-2 px-2 hover:bg-gray-100 rounded text-left font-medium cursor-pointer">
                <div className="flex items-start space-x-2">
                  <span className="text-gray-500 ">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{lesson.title}</span>
                </div>
                <ChevronDownIcon className="transition-transform duration-200 AccordionChevron" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="mt-2 ml-6 space-y-2">
              {lesson.sub_lessons.map(subLesson => (
                <button
                  key={subLesson.id}
                  onClick={() => handleSubLessonClick(subLesson)}
                  className={`flex items-center w-full text-left text-sm p-2 rounded hover:bg-gray-100 cursor-pointer ${
                    currentLesson?.id === subLesson.id
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-gray-700"
                  }`}
                >
                  <span className="mr-2">{getStatusIcon(subLesson)}</span>
                  {subLesson.title}
                </button>
              ))}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
}
