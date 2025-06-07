import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

async function deleteMuxAsset(assetId: string): Promise<boolean> {
  if (!assetId) return false;
  
  try {
    console.log(`🗑️ Attempting to delete Mux asset: ${assetId}`);
    const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mux-delete-asset?assetId=${assetId}`, {
      method: 'DELETE',
    });
    
    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log(`✅ Successfully deleted Mux asset: ${assetId}`);
      return true;
    } else {
      const errorResult = await deleteResponse.json();
      console.warn(`⚠️ Failed to delete Mux asset ${assetId}:`, errorResult);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error deleting Mux asset ${assetId}:`, error);
    return false;
  }
}

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
    console.log(`📊 Fetching course data for deletion: ${courseId}`);
    const { data: courseData, error: courseDataError } = await supabase
      .from("courses")
      .select("video_trailer_mux_asset_id")
      .eq("id", courseId)
      .single();

    if (courseDataError) {
      console.error("Error fetching course data:", courseDataError);
      return NextResponse.json(
        {
          error: "Failed to fetch course data",
          details: courseDataError.message,
        },
        { status: 500 }
      );
    }

    console.log(`📊 Fetching sub-lesson video data for course: ${courseId}`);
    
    const { data: lessonsData, error: lessonsDataError } = await supabase
      .from("lessons")
      .select("id")
      .eq("course_id", courseId);

    if (lessonsDataError) {
      console.error("Error fetching lessons data:", lessonsDataError);
    }

    let subLessonsData = null;
    if (lessonsData && lessonsData.length > 0) {
      const lessonIds = lessonsData.map(lesson => lesson.id);
      
      const { data: subLessonsResult, error: subLessonsDataError } = await supabase
        .from("sub_lessons")
        .select("mux_asset_id")
        .in("lesson_id", lessonIds)
        .not("mux_asset_id", "is", null);

      if (subLessonsDataError) {
        console.error("Error fetching sub-lessons data:", subLessonsDataError);
      } else {
        subLessonsData = subLessonsResult;
      }
    }

    const muxAssetsToDelete: string[] = [];
    
    if (courseData?.video_trailer_mux_asset_id) {
      muxAssetsToDelete.push(courseData.video_trailer_mux_asset_id);
    }
    
    if (subLessonsData && subLessonsData.length > 0) {
      const subLessonAssets = subLessonsData
        .map(subLesson => subLesson.mux_asset_id)
        .filter(Boolean);
      muxAssetsToDelete.push(...subLessonAssets);
    }

    console.log(`🎥 Found ${muxAssetsToDelete.length} Mux assets to delete for course ${courseId}:`, muxAssetsToDelete.map(id => id?.substring(0, 8) + '...'));

    const muxDeletionResults = [];
    for (const assetId of muxAssetsToDelete) {
      const success = await deleteMuxAsset(assetId);
      muxDeletionResults.push({ assetId, success });
    }

    const successfulMuxDeletions = muxDeletionResults.filter(result => result.success).length;
    const failedMuxDeletions = muxDeletionResults.filter(result => !result.success).length;
    
    if (muxAssetsToDelete.length > 0) {
      console.log(`📊 Mux deletion summary: ${successfulMuxDeletions} successful, ${failedMuxDeletions} failed`);
    }

    console.log(`🗄️ Starting database deletion for course: ${courseId}`);

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

    const { data: courseAssignments, error: courseAssignmentsError } = await supabase
      .from("assignments")
      .select("id")
      .eq("course_id", courseId);

    if (!courseAssignmentsError && courseAssignments && courseAssignments.length > 0) {
      const assignmentIds = courseAssignments.map(assignment => assignment.id);
      
      const { error: submissionsDeleteError } = await supabase
        .from("submissions")
        .delete()
        .in("assignment_id", assignmentIds);

      if (submissionsDeleteError) {
        console.error("Error deleting submissions:", submissionsDeleteError);
        return NextResponse.json(
          {
            error: "Failed to delete submissions",
            details: submissionsDeleteError.message,
          },
          { status: 500 }
        );
      }
    }

    const { error: assignmentsDeleteError } = await supabase
      .from("assignments")
      .delete()
      .eq("course_id", courseId);

    if (assignmentsDeleteError) {
      console.error("Error deleting assignments:", assignmentsDeleteError);
      return NextResponse.json(
        {
          error: "Failed to delete assignments",
          details: assignmentsDeleteError.message,
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

    console.log(`✅ Successfully deleted course ${courseId} and all related data`);

    const responseMessage = muxAssetsToDelete.length > 0 
      ? `Course and its related lessons, sub-lessons, assignments, and video assets deleted successfully. Mux video cleanup: ${successfulMuxDeletions} successful, ${failedMuxDeletions} failed out of ${muxAssetsToDelete.length} total assets.`
      : "Course and its related lessons, sub-lessons, and assignments deleted successfully";

    return NextResponse.json({
      message: responseMessage,
      muxCleanupSummary: muxAssetsToDelete.length > 0 ? {
        totalAssets: muxAssetsToDelete.length,
        successful: successfulMuxDeletions,
        failed: failedMuxDeletions,
        failedAssets: muxDeletionResults.filter(result => !result.success).map(result => result.assetId)
      } : null
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
