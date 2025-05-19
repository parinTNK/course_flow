"use client";

import { useLearning } from "./context/LearningContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import { useProgress } from "./context/ProgressContext";

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
}

export default function Sidebar({ setLessons: setParentLessons }: SidebarProps) {
  const { courseId } = useParams();
  const { currentLesson, setCurrentLesson } = useLearning();
  const [loading, setLoading] = useState(true);
  const [localLessons, setLocalLessons] = useState<Lesson[]>([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  // 🧠 ฟังก์ชันเลือก icon ตาม watch_status
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

  const { progressUpdated } = useProgress(); 

  useEffect(() => {
    const fetchCourseAndLessons = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 📌 ดึงข้อมูลคอร์ส
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, name, summary, detail, total_learning_time')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;

        setCourseTitle(courseData.name);
        setCourseDescription(courseData.summary);

        // 📌 ดึงบทเรียน + sub_lessons
        const { data: lessonData, error: lessonError } = await supabase
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

        if (lessonError) throw lessonError;

        const sortedLessons = lessonData?.map(lesson => ({
          ...lesson,
          sub_lessons: lesson.sub_lessons.sort((a, b) => a.order_no - b.order_no)
        })) || [];

        // 📌 ดึง lesson_progress ของ user ปัจจุบัน
        const { data: progressData, error: progressError } = await supabase
          .from("lesson_progress")
          .select("sub_lesson_id, status")
          .eq("user_id", user.id);

        if (progressError) {
          console.error("Error fetching lesson_progress:", progressError);
        }

        // 🧠 map watch_status กลับเข้า sub_lessons
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

        // 🎯 คำนวณ courseProgress (% ที่ดูจบแล้ว)
        const allSubLessons = lessonsWithStatus.flatMap(l => l.sub_lessons);
        const completedCount = allSubLessons.filter(s => s.watch_status === "completed").length;
        const progress = Math.round((completedCount / allSubLessons.length) * 100);
        setCourseProgress(progress);

        setLoading(false);
      } catch (error) {
        console.error("Error loading course content:", error);
      }
    };

    fetchCourseAndLessons();
  }, [courseId, setParentLessons, progressUpdated]);

  const handleSubLessonClick = (subLesson: SubLesson) => {
    setCurrentLesson(subLesson);
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="w-64 bg-white border-r p-4 min-h-screen">
      <div className="mb-6">
        <span className="text-sm text-orange-500">Course</span>
        <h2 className="text-lg font-bold mb-2">{courseTitle}</h2>
        <p className="text-sm text-gray-500 mb-4">{courseDescription}</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${courseProgress}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{courseProgress}% Complete</span>
      </div>
      
      <div className="space-y-2">
        {localLessons.map((lesson, index) => (
          <div key={lesson.id} className="mb-4">
            <div className="flex items-center mb-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <span className="text-gray-500 text-sm mr-2">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-medium">{lesson.title}</span>
            </div>
            
            <ul className="ml-6 space-y-2">
              {lesson.sub_lessons.map((subLesson) => (
                <li 
                  key={subLesson.id} 
                  className="flex items-center py-1 cursor-pointer hover:bg-gray-50 rounded px-2"
                  onClick={() => handleSubLessonClick(subLesson)}
                >
                  <span className="mr-2">{getStatusIcon(subLesson.watch_status)}</span>
                  <span className={`text-sm ${
                    currentLesson?.id === subLesson.id 
                      ? "text-blue-500 font-medium" 
                      : "text-gray-700"
                  }`}>
                    {subLesson.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
