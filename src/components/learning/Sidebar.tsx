"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { useLearning } from "./context/LearningContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import { useProgress } from "./context/ProgressContext";
import { ChevronDownIcon } from "lucide-react";


type WatchStatus = "not_started" | "in_progress" | "completed";

interface SubLesson {
  id: string;
  title: string;
  video_url: string;
  order_no: number;
  watch_status?: WatchStatus;
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
}

export default function Sidebar({ setLessons: setParentLessons, scrollToVideo }: SidebarProps) {
  const { courseId } = useParams();
  const { currentLesson, setCurrentLesson } = useLearning();
  const [loading, setLoading] = useState(true);
  const [localLessons, setLocalLessons] = useState<Lesson[]>([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const { progressUpdated } = useProgress();

  const getStatusIcon = (status?: WatchStatus) => {
    switch (status) {
      case "completed":
        return <img src="/Vector-2.svg" alt="completed" className="w-5 h-5" />;
      case "in_progress":
        return <img src="/Ellipse 9.svg" alt="in progress" className="w-4 h-4" />;
      default:
        return <img src="/Frame-7.svg" alt="not started" className="w-5 h-5" />;
    }
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
              order_no
            )
          `)
          .eq('course_id', courseId)
          .order('order_no');

        const sortedLessons = lessonData.map(lesson => ({
          ...lesson,
          sub_lessons: lesson.sub_lessons.sort((a, b) => a.order_no - b.order_no),
        }));

        const { data: progressData } = await supabase
          .from("lesson_progress")
          .select("sub_lesson_id, status")
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

        const allSubLessons = lessonsWithStatus.flatMap(l => l.sub_lessons);
        const completedCount = allSubLessons.filter(s => s.watch_status === "completed").length;
        setCourseProgress(Math.round((completedCount / allSubLessons.length) * 100));

        setLoading(false);
      } catch (error) {
        console.error("Error loading course content:", error);
      }
    };

    fetchCourseAndLessons();
  }, [courseId, setParentLessons, progressUpdated]);

const router = useRouter();

const handleSubLessonClick = (subLesson: SubLesson) => {
  setCurrentLesson(subLesson);
  router.push(`/course-learning/${courseId}/learning/${subLesson.id}`);
  setTimeout(() => {
    scrollToVideo();
  }, 150);
};


  if (loading) return <div className="p-4">Loading...</div>;

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

      <Accordion.Root type="multiple" className="space-y-2">
        {localLessons.map((lesson, index) => (
          <Accordion.Item key={lesson.id} value={lesson.id} className="border-b pb-2">
            <Accordion.Header>
              <Accordion.Trigger className="flex justify-between items-center w-full py-2 px-2 hover:bg-gray-100 rounded text-left font-medium">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
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
                  className={`flex items-center w-full text-left text-sm p-2 rounded hover:bg-gray-100 ${
                    currentLesson?.id === subLesson.id
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-gray-700"
                  }`}
                >
                  <span className="mr-2">{getStatusIcon(subLesson.watch_status)}</span>
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