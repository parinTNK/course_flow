import { supabase } from "@/lib/supabaseClient";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  const url = new URL(req.url);
  const courseId = url.searchParams.get("courseId");

  if (!userId || !courseId) {
    return Response.json(
      { error: "userId and courseId are required" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .limit(1)
      .maybeSingle();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ purchased: !!data });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || "Unknown error" },
      { status: 500 }
    );
  }
}
