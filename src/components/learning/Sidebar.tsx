"use client";

import { useLearning } from "./context/LearningContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

interface Courses {
  id: string;
  name: string;
  summary: string;
  detail: string;
  cover_image_url: string;
  video_trailer_url: string;
  total_learning_time: number;
  status: string;
}

interface SubLesson {
  id: string;
  title: string;
  video_url: string;
  order_no: number;
  is_completed?: boolean; // เพิ่มเติมสำหรับติดตามความคืบหน้า
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

  useEffect(() => {
    const fetchCourseAndLessons = async () => {
      try {
        // ดึงข้อมูลคอร์ส
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, name, summary, detail, total_learning_time')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;

        setCourseTitle(courseData.name);
        setCourseDescription(courseData.summary);

        // ดึงข้อมูลบทเรียนและ sub-lessons
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

        // จัดเรียง sub_lessons ตาม order_no
        const sortedLessons = lessonData?.map(lesson => ({
          ...lesson,
          sub_lessons: lesson.sub_lessons.sort((a, b) => a.order_no - b.order_no)
        })) || [];

        setLocalLessons(sortedLessons);
        setParentLessons(sortedLessons); // ส่งข้อมูลกลับไปที่ parent
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchCourseAndLessons();
  }, [courseId, setParentLessons]);

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
                  <span className={`w-5 h-5 rounded-full ${
                    subLesson.is_completed 
                      ? 'bg-green-500 flex items-center justify-center' 
                      : 'border border-gray-300'
                  } mr-2`}>
                    {subLesson.is_completed && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white">
                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
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