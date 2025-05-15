"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // เพิ่ม import
import { LearningProvider } from "@/components/learning/context/LearningContext";
import Sidebar from "@/components/learning/Sidebar";
import LessonContent from "@/components/learning/LessonContent";
import Assignment from "@/components/learning/Assignment";
import { useLearning } from "@/components/learning/context/LearningContext";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

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
  const { courseId } = useParams(); // เพิ่มการดึง courseId
  const { currentLesson, setCurrentLesson } = useLearning();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // ดึงข้อมูล user ปัจจุบัน
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login'); // ถ้ายังไม่ login ให้ redirect ไปหน้า login
          return;
        }

        // ตรวจสอบการ subscribe คอร์ส
        const { data: subscription, error } = await supabase
          .from('course_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single();

        if (error || !subscription) {
          router.push('/courses'); // ถ้ายังไม่ได้ subscribe ให้ redirect ไปหน้าคอร์ส
          return;
        }

        setIsSubscribed(true);
        setLoading(false);
      } catch (error) {
        console.error('Error checking subscription:', error);
        router.push('/courses');
      }
    };

    checkSubscription();
  }, []);

  // ถ้ากำลังโหลดหรือยังไม่ได้ subscribe ให้แสดง loading
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  // ถ้าไม่ได้ subscribe จะถูก redirect ไปแล้ว
  return (
    <div className="flex min-h-screen bg-gray-50 pt-44 max-w-screen-xl mx-auto px-4">
      {/* Sidebar */}
      <div className="sticky top-16">
        <Sidebar setLessons={setLessons} />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 p-6 max-w-[calc(100%-280px)]">
        {/* Course Title */}
        <h1 className="text-2xl font-bold mb-6">
          {currentLesson?.title || (lessons[0]?.sub_lessons[0]?.title || "เลือกบทเรียน")}
        </h1>
        
        {/* Video Player */}
        <div className="aspect-video bg-gray-200 mb-6 rounded-lg overflow-hidden">
          <div className="w-full h-full relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-16 h-16 bg-gray-500/50 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-500/60 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
              </button>
            </div>
            <img 
              src="/course-thumbnail.jpg" 
              alt="Course thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Lesson Content */}
        <LessonContent />
        
        {/* Assignment */}
        <Assignment />
        
        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
          <button
            className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Previous Lesson
          </button>
          
          <button
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      <CourseContent />
    </LearningProvider>
  );
}