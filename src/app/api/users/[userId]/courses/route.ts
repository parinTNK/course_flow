import { supabase } from "@/lib/supabaseClient";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  if (!userId) {
    return Response.json({ error: "user_id is required" }, { status: 400 });
  }

  try {
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select(
        `
        id,
        course_id,
        subscription_date,
        progress,
        rating,
        review,
        courses (
          id,
          name,
          price,
          total_learning_time,
          summary,
          cover_image_url,
          status
        )
      `
      )
      .eq("user_id", userId);

    if (subError) {
      return Response.json({ error: subError.message }, { status: 500 });
    }

    const courseIds = (subscriptions || [])
      .map((row) => row.course_id)
      .filter(Boolean);

    if (courseIds.length === 0) {
      return Response.json([]);
    }

    const { data: lessons, error: lessonError } = await supabase
      .from("lessons")
      .select("id, course_id")
      .in("course_id", courseIds);

    if (lessonError) {
      return Response.json({ error: lessonError.message }, { status: 500 });
    }

    const lessonCountMap: Record<string, number> = {};
    (lessons || []).forEach((row) => {
      lessonCountMap[row.course_id] = (lessonCountMap[row.course_id] || 0) + 1;
    });

    const courses = (subscriptions || [])
      .filter((row) => row.courses)
      .map((row) => ({
        subscriptions_id: row.id,
        progress: row.progress,
        ...row.courses,
        lessons: lessonCountMap[row.course_id] || 0,
      }));

      
    return Response.json(courses);
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || "Unknown error" },
      { status: 500 }
    );
  }
}
