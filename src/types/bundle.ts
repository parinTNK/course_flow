// เพิ่ม interface สำหรับ Supabase response
interface SupabaseCourse {
  id: string;
  name: string;
  price: number | null;
  summary: string | null;
  cover_image_url: string | null;
  total_learning_time: number | null;
  total_lessons: number | null;
  status: 'active' | 'inactive';
}

interface BundleCourseWithCourse {
  bundle_id: string;
  course_id: string;
  courses: SupabaseCourse | null;
}

export interface Course {
  id: string;
  name: string;
  price?: number;
  summary?: string;
  cover_image_url?: string;
  total_learning_time?: number;
  total_lessons?: number;
  status: 'active' | 'inactive';
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  detail: string;
  price: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface BundleWithDetails extends Bundle {
  courses_count: number;
  courses_total_price: number;
  discount_amount: number;
  discount_percentage: number;
  total_learning_time: number;
  total_lessons: number;
  courses: Course[];
}
export interface Bundle {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  status: 'active' | 'inactive';
  courses_count?: number;
  total_learning_time?: number;
  created_at: string;
  updated_at: string;
}

export interface BundleSummary {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  courses_count: number;
  total_learning_time: number;
}