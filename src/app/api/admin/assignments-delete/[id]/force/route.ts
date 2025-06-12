import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const assignmentId = params.id;

  if (!assignmentId) {
    return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
  }

  try {
    // 1. Delete submissions first
    const { error: submissionDeleteError } = await supabase
      .from("submissions")
      .delete()
      .eq("assignment_id", assignmentId);

    if (submissionDeleteError) {
      return NextResponse.json(
        {
          error: "Failed to delete related submissions",
          details: submissionDeleteError.message,
        },
        { status: 500 }
      );
    }

    // 2. Then delete the assignment
    const { error: assignmentDeleteError } = await supabase
      .from("assignments")
      .delete()
      .eq("id", assignmentId);

    if (assignmentDeleteError) {
      return NextResponse.json(
        {
          error: "Failed to delete assignment",
          details: assignmentDeleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Assignment and submissions deleted successfully.",
    });
  } catch (error: any) {
    console.error("Unexpected error in /force delete:", error);
    return NextResponse.json(
      {
        error: "Unexpected error occurred",
        details: error.message || "Unknown",
      },
      { status: 500 }
    );
  }
}
