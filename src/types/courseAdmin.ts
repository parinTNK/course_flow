export interface SubLesson {
  id: number | string;
  name: string;            // Frontend property 
  title?: string;          // Database property
  videoUrl?: string;       // Frontend property
  video_url?: string;      // Database property
  lesson_id?: string;
  content?: string;
  content_type?: string;
  order?: number;          // Frontend property
  order_no?: number;       // Database property
}

export interface Lesson {
  id: number | string;
  name: string;            // Frontend property
  title?: string;          // Database property
  course_id?: string;
  order?: number;          // Frontend property
  order_no?: number;       // Database property
  sub_lessons_attributes?: SubLesson[];
  sub_lessons?: SubLesson[]; // Direct from database
  subLessons?: SubLesson[]; // Legacy/alternative naming
}

export interface CourseFormData {
  id?: string;
  name: string;
  price: string | number;
  total_learning_time: string | number;
  summary: string;
  detail: string;
  status?: 'draft' | 'published';
  cover_image_url?: string | null;
  promo_code_id: string | null;
  lessons_attributes?: Lesson[];
  lessons?: Lesson[];      // Direct from database
}

export interface PromoCode {
    id: string;
    code: string;
    min_purchase_amount?: number | null;
    discount_type?: 'fixed' | 'percentage' | null;
    discount_value?: number | null;
    discount_percentage?: number | null;
  }
