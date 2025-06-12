import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const assignmentId = params.id;

  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", assignmentId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
