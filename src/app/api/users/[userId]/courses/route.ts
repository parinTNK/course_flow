import { supabase } from "@/lib/supabaseClient";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "6", 10);
  const searchTerm = url.searchParams.get("search") || "";
  const tab = url.searchParams.get("tab") || "all";

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const userId = params.userId;

  if (!userId) {
    return Response.json({ error: "user_id is required" }, { status: 400 });
  }

  try {

    let query = supabase
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
      `,
        { count: "exact" }
      )
      .eq("user_id", userId);


    if (tab === "inprogress") {
      query = query.gt("progress", 0).lt("progress", 99);
    } else if (tab === "completed") {
      query = query.eq("progress", 100);
    }


    query = query.range(from, to);

    const { data: subscriptions, error: subError, count: tabCount } = await query;

    if (subError) {
      return Response.json({ error: subError.message }, { status: 500 });
    }

    let filteredSubscriptions = subscriptions || [];
    if (searchTerm) {
      filteredSubscriptions = filteredSubscriptions.filter((row) => {
        const courseObj = Array.isArray(row.courses)
          ? row.courses[0]
          : row.courses;
        return courseObj?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      });
    }

    const courseIds = filteredSubscriptions
      .map((row) => row.course_id)
      .filter(Boolean);

    if (courseIds.length === 0) {
      const { count: allCount } = await supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      const { count: inprogressCount } = await supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gt("progress", 0)
        .lt("progress", 99);

      const { count: completedCount } = await supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("progress", 100);

      return Response.json({
        data: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          limit,
          allCount: allCount || 0,
          inprogressCount: inprogressCount || 0,
          completedCount: completedCount || 0,
        },
      });
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


    const courses = filteredSubscriptions
      .filter((row) => {
        if (Array.isArray(row.courses)) {
          return row.courses.length > 0;
        }
        return !!row.courses;
      })
      .map((row) => {
        const courseObj = Array.isArray(row.courses)
          ? row.courses[0]
          : row.courses;
        return {
          subscriptions_id: row.id,
          progress: row.progress,
          ...courseObj,
          lessons: lessonCountMap[row.course_id] || 0,
        };
      });

    const { count: allCount } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: inprogressCount } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("progress", 0)
      .lt("progress", 99);

    const { count: completedCount } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("progress", 100);

    let total = 0;
    if (searchTerm) {
      total = filteredSubscriptions.length;
    } else if (tab === "all") {
      total = allCount || 0;
    } else if (tab === "inprogress") {
      total = inprogressCount || 0;
    } else if (tab === "completed") {
      total = completedCount || 0;
    }

    const totalPages = Math.ceil(total / limit);

    return Response.json({
      data: courses,
      pagination: {
        totalItems: total,
        totalPages: totalPages,
        currentPage: page,
        limit,
        allCount: allCount || 0,
        inprogressCount: inprogressCount || 0,
        completedCount: completedCount || 0,
      },
    });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || "Unknown error" },
      { status: 500 }
    );
  }
}
