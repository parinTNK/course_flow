export type Lesson = {
    id: string;
    title: string;
    order_no: number;
    course_id: string;
    created_at: string;
    updated_at: string;
    sub_lessons?: SubLesson[];
  };
  
  export type Course = {
    id: string;
    name: string;
    price: number;
    status: string;
    summary: string;
    detail: string;
    cover_image_url: string | null;
    image_url: string | null;
    attachment_url: string | null;
    video_trailer_url: string | null;
    total_learning_time: number;
    progress: number;
    lessons?: Lesson[];
  };

  export type SubLesson = {
  id: string;
  title: string;
  order_no: number;
  course_id: string;
  created_at: string;
  updated_at: string;
  };

  // CourseSummary for use in CourseCard
  export type CourseSummary = Pick<
    Course,
    "id" | "name" | "summary" | "cover_image_url" | "total_learning_time"
  > & {
    lessons: { id: string }[];
  };
