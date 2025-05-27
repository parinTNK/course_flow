import { supabase } from "@/lib/supabaseClient";
import { NextRequest } from "next/server";

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get("assignmentId");
  const userId = searchParams.get("userId");

  if (!assignmentId || !userId) {
    return Response.json({ error: "Missing assignmentId or userId" }, { status: 400 });
  }

  const body = await req.json();
  let { answer, status, submission_date, updated_at } = body;

  // If answer is empty and status is not provided, set status to "pending"
  if (typeof answer === "string" && answer.trim() === "" && !status) {
    status = "pending";
  }

  const updateData: any = {
    answer,
    status,
    updated_at: updated_at || new Date().toISOString(),
  };
  if (submission_date) updateData.submission_date = submission_date;

  // Try to update
  const { data, error } = await supabase
    .from("submissions")
    .update(updateData)
    .match({ assignment_id: assignmentId, user_id: userId })
    .select();

  // ⚠️ If no row was updated, create a new one instead
  if (!error && data.length === 0) {
    const { data: createdData, error: insertError } = await supabase
      .from("submissions")
      .insert([
        {
          assignment_id: assignmentId,
          user_id: userId,
          answer,
          status,
          submission_date: submission_date || new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json({ data: createdData, created: true }); // Optional `created` flag
  }

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data, updated: true }); // Optional `updated` flag
}
