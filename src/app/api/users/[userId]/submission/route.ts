import { supabase } from "@/lib/supabaseClient";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  if (!userId) {
    return Response.json(
      { error: "userId is required" },
      { status: 400 }
    );
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

    // 2. Get all assignments for those courses
    const { data: assignments, error: assignError } = await supabase
      .from("assignments")
      .select("*")
      .in("course_id", courseIds);

    if (assignError) {
      return Response.json({ error: assignError.message }, { status: 500 });
    }

    // 3. Get all submissions by the user for these assignments
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

    // 4. Merge assignments with their submission (if any)
    const assignmentsWithSubmission = assignments.map((assignment) => {
      const submission = submissions.find(
        (s) => s.assignment_id === assignment.id
      );
      return {
        ...assignment,
        submission: submission || null,
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
