import { supabase } from "@/lib/supabaseClient";
import { NextRequest } from "next/server";

// Define types for course and wishlist item
type Lesson = {
  id: string;
  title: string;
  // Add other lesson fields as needed
};

type Course = {
  id: string;
  name: string;
  price: number;
  total_learning_time: string;
  summary: string;
  detail: string;
  promo_code_id: string | null;
  cover_image_url: string;
  video_trailer_url: string;
  attachment_url: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  status: string;
  lessons: Lesson[];
};

type WishlistItem = {
  id: string;
  user_id: string;
  course_id: string;
  created_at: string;
  courses: Course | null;
};

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "12", 10);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("wishlist")
      .select("id", { count: "exact", head: true });

    if (countError) {
      return Response.json({ error: countError.message }, { status: 400 });
    }

    // Fetch wishlist with course details and lessons
    const { data, error } = await supabase
      .from("wishlist")
      .select(
        `
        id,
        user_id,
        course_id,
        created_at,
        courses (
          id,
          name,
          price,
          total_learning_time,
          summary,
          detail,
          promo_code_id,
          cover_image_url,
          video_trailer_url,
          attachment_url,
          created_at,
          updated_at,
          published_at,
          status,
          lessons ( * )
        )
      `
      )
      .range(from, to)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    // Format data for frontend
    const formattedData = (data as any[])
      .map((item) => {
        const rawCourse = item.courses;
        const course = Array.isArray(rawCourse) ? rawCourse[0] : rawCourse;

        if (!course) return null;

        const { cover_image_url, lessons, ...restOfCourse } = course;

        return {
          ...restOfCourse,
          image_url: cover_image_url,
          lessons,
          lessons_count: lessons.length,
          user_id: item.user_id,
        };
      })
      .filter(Boolean);
    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    return Response.json(
      {
        courses: formattedData,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    return Response.json(
      { error: (e as Error).message || "Unknown error" },
      { status: 500 }
    );
  }
}
