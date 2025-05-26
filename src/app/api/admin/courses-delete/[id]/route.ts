import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: courseId } = await params;

  if (!courseId) {
    return NextResponse.json(
      { error: "Course ID is required" },
      { status: 400 }
    );
  }

  try {
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("course_id", courseId)
      .limit(1);

    if (subscriptionsError) {
      console.error("Error checking for subscriptions:", subscriptionsError);
      return NextResponse.json(
        {
          error: "Failed to check for subscriptions",
          details: subscriptionsError.message,
        },
        { status: 500 }
      );
    }

    if (subscriptions && subscriptions.length > 0) {
      console.log(
        `Warning: Course ${courseId} has active subscriptions but will be deleted as confirmed by admin`
      );
    }

    const { error: subscriptionsDeleteError } = await supabase
      .from("subscriptions")
      .delete()
      .eq("course_id", courseId);

    if (subscriptionsDeleteError) {
      console.error("Error deleting subscriptions:", subscriptionsDeleteError);
      return NextResponse.json(
        {
          error: "Failed to delete subscriptions",
          details: subscriptionsDeleteError.message,
        },
        { status: 500 }
      );
    }

    const { error: paymentsDeleteError } = await supabase
      .from("payments")
      .delete()
      .eq("course_id", courseId);

    if (paymentsDeleteError) {
      console.error("Error deleting payments:", paymentsDeleteError);
      return NextResponse.json(
        {
          error: "Failed to delete payments",
          details: paymentsDeleteError.message,
        },
        { status: 500 }
      );
    }

    const { error: promoCodeCoursesDeleteError } = await supabase
      .from("promo_code_courses")
      .delete()
      .eq("course_id", courseId);

    if (promoCodeCoursesDeleteError) {
      console.error(
      "Error deleting promo code course relationships:",
      promoCodeCoursesDeleteError
      );
    }

    const { error: courseUpdateError } = await supabase
      .from("courses")
      .update({ promo_code_id: null })
      .eq("id", courseId);

    if (courseUpdateError) {
      console.error("Error updating course promo_code_id:", courseUpdateError);
    }

    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id")
      .eq("course_id", courseId);

    if (lessonsError) {
      console.error("Error fetching lessons for deletion:", lessonsError);
      return NextResponse.json(
        {
          error: "Failed to fetch lessons for deletion",
          details: lessonsError.message,
        },
        { status: 500 }
      );
    }

    if (lessons && lessons.length > 0) {
      const lessonIds = lessons.map((lesson) => lesson.id);

      const { error: subLessonsDeleteError } = await supabase
        .from("sub_lessons")
        .delete()
        .in("lesson_id", lessonIds);

      if (subLessonsDeleteError) {
        console.error("Error deleting sub-lessons:", subLessonsDeleteError);
        return NextResponse.json(
          {
            error: "Failed to delete sub-lessons",
            details: subLessonsDeleteError.message,
          },
          { status: 500 }
        );
      }

      const { error: lessonsDeleteError } = await supabase
        .from("lessons")
        .delete()
        .in("id", lessonIds);

      if (lessonsDeleteError) {
        console.error("Error deleting lessons:", lessonsDeleteError);
        return NextResponse.json(
          {
            error: "Failed to delete lessons",
            details: lessonsDeleteError.message,
          },
          { status: 500 }
        );
      }
    }

    const { error: courseDeleteError } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (courseDeleteError) {
      console.error("Error deleting course:", courseDeleteError);
      return NextResponse.json(
        {
          error: "Failed to delete course",
          details: courseDeleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        "Course and its related lessons and sub-lessons deleted successfully",
    });
  } catch (error: any) {
    console.error(
      "Error in DELETE /api/admin/courses-delete/[courseId]:",
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
