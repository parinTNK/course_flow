export type Lesson = {
    id: string;
    title: string;
    order_no: number;
    course_id: string;
    created_at: string;
    updated_at: string;
  };
  
  export type Course = {
    id: string;
    name: string;
    price: number;
    status: string;
    lessons: Lesson[];
    summary: string;
    cover_image_url: string;
    total_learning_time: number;
    progress: number;
  };