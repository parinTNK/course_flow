import { supabase } from "@/lib/supabaseClient";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    // 1. Get all course_ids the user is subscribed to
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("course_id")
      .eq("user_id", userId);

    if (subError) {
      return Response.json({ error: subError.message }, { status: 500 });
    }

    const courseIds = subscriptions?.map((s) => s.course_id) || [];
    if (courseIds.length === 0) {
      return Response.json({ data: [] });
    }

    // 2. Get enriched assignments with joins
    const { data: assignments, error: assignError } = await supabase
      .from("assignments")
      .select(`
        id,
        course_id,
        title,
        description,
        solution,
        lesson_id,
        sub_lesson_id,
        courses (
          name
        ),
        lessons (
          title
        ),
        sub_lessons (
          title
        )
      `)
      .in("course_id", courseIds);

    if (assignError) {
      return Response.json({ error: assignError.message }, { status: 500 });
    }

    // 3. Get submissions
    const assignmentIds = assignments.map((a) => a.id);
    let submissions: any[] = [];
    if (assignmentIds.length > 0) {
      const { data: submissionsData, error: submError } = await supabase
        .from("submissions")
        .select("*")
        .eq("user_id", userId)
        .in("assignment_id", assignmentIds);

      if (submError) {
        return Response.json({ error: submError.message }, { status: 500 });
      }
      submissions = submissionsData || [];
    }

    // 4. Merge + enrich
    const assignmentsWithSubmission = assignments.map((assignment: any) => {
      const submission = submissions.find(
        (s) => s.assignment_id === assignment.id
      );

      return {
        id: assignment.id,
        course_id: assignment.course_id,
        lesson_id: assignment.lesson_id,
        sub_lesson_id: assignment.sub_lesson_id,
        title: assignment.title,
        description: assignment.description,
        solution: assignment.solution,
        submission: submission || null,

        course_name: assignment.courses?.name ?? null,
        lesson_title: assignment.lessons?.title ?? null,
        sub_lesson_title: assignment.sub_lessons?.title ?? null,
      };
    });

    return Response.json({ data: assignmentsWithSubmission });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || "Unknown error" },
      { status: 500 }
    );
  }
}
