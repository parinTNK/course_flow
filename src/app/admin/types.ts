export type Course = {
  id: string;
  name: string;
  image_url: string | null;
  lessons_count: number | null;
  price: number | null;
  status: string; 
  created_at: string;
  updated_at: string;
  course_name?: string; 
};
