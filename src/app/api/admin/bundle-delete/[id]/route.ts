import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const bundleId = params.id;
  
  console.log("🗑️ Deleting bundle:", bundleId);

  try {
    // ลบ bundle_courses ก่อน (foreign key constraint)
    const { error: coursesError } = await supabase
      .from("bundle_courses")
      .delete()
      .eq("bundle_id", bundleId);

    if (coursesError) {
      console.error("❌ Error deleting bundle courses:", coursesError);
      return NextResponse.json(
        { error: "Failed to delete associated courses: " + coursesError.message },
        { status: 500 }
      );
    }

    console.log("✅ Bundle courses deleted");

    // ลบ bundle
    const { error: bundleError } = await supabase
      .from("bundles")
      .delete()
      .eq("id", bundleId);

    if (bundleError) {
      console.error("❌ Error deleting bundle:", bundleError);
      return NextResponse.json(
        { error: bundleError.message },
        { status: 500 }
      );
    }

    console.log("✅ Bundle deleted successfully");

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return NextResponse.json(
      { error: "Unexpected error occurred" },
      { status: 500 }
    );
  }
}