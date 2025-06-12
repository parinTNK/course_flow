export interface Assignment {
  id: string;
  title: string;
  description?: string;
  course_id: string;
  lesson_id: string;
  sub_lesson_id: string;
  start_date?: string;
  end_date?: string;
  solution?: string;
  created_at: string;
  updated_at?: string;
}

// ใช้ตอนดึงข้อมูลแบบ join จาก supabase
export interface FullAssignment extends Assignment {
  course_name: string;
  lesson_name: string;
  sub_lesson_name: string;
}

export type SubLessonDeepJoin = {
  id: string;
  title: string;
  lessons: {
    id: string;
    title: string;
    courses: {
      id: string;
      name: string;
    };
  };
};
