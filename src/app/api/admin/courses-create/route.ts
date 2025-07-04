import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getBangkokISOString } from "@/lib/bangkokTime";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      summary,
      detail,
      price,
      total_learning_time,
      cover_image_url,
      video_trailer_mux_asset_id,
      video_trailer_url,
      status,
      lessons_attributes,
      lessons,
    } = body;

    const lessonsData = lessons_attributes || lessons;

    if (!name) {
      return NextResponse.json(
        { error: "Course name is required" },
        { status: 400 }
      );
    }

    if (name.length < 10) {
      return NextResponse.json(
        { error: "Course name must be at least 10 characters long" },
        { status: 400 }
      );
    }

    if (!video_trailer_mux_asset_id || !video_trailer_url) {
      return NextResponse.json(
        { error: "Video trailer is required for course creation" },
        { status: 400 }
      );
    }

    if (
      !lessonsData ||
      !Array.isArray(lessonsData) ||
      lessonsData.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one lesson is required for course creation" },
        { status: 400 }
      );
    }

    for (let i = 0; i < lessonsData.length; i++) {
      const lesson = lessonsData[i];
      const subLessonsData =
        lesson.sub_lessons_attributes || lesson.sub_lessons || [];

      if (
        !subLessonsData ||
        !Array.isArray(subLessonsData) ||
        subLessonsData.length === 0
      ) {
        return NextResponse.json(
          {
            error: `Lesson "${
              lesson.title || lesson.name || `Lesson ${i + 1}`
            }" must have at least one sub-lesson`,
          },
          { status: 400 }
        );
      }

      for (let j = 0; j < subLessonsData.length; j++) {
        const subLesson = subLessonsData[j];
        const videoUrl = subLesson.video_url || subLesson.videoUrl;

        if (!videoUrl || videoUrl.trim() === "") {
          return NextResponse.json(
            {
              error: `Sub-lesson "${
                subLesson.title || subLesson.name || `Sub-lesson ${j + 1}`
              }" in "${
                lesson.title || lesson.name || `Lesson ${i + 1}`
              }" must have a video`,
            },
            { status: 400 }
          );
        }
      }
    }

    const bangkok = getBangkokISOString();

    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .insert({
        name,
        summary: summary || "",
        detail: detail || "",
        price: price || 0,
        total_learning_time: total_learning_time || 0,
        cover_image_url: cover_image_url || "",
        video_trailer_mux_asset_id: video_trailer_mux_asset_id || null,
        video_trailer_url: video_trailer_url || null,
        status: status || "draft",
        created_at: bangkok,
        updated_at: bangkok,
      })
      .select();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    const courseId = courseData[0].id;

    if (lessonsData && Array.isArray(lessonsData) && lessonsData.length > 0) {
      for (let i = 0; i < lessonsData.length; i++) {
        const lesson = lessonsData[i];

        const { data: lessonData, error: lessonError } = await supabase
          .from("lessons")
          .insert({
            course_id: courseId,
            title: lesson.title || lesson.name || "",
            order_no: lesson.order_no || lesson.order || i + 1,
            created_at: bangkok,
            updated_at: bangkok,
          })
          .select();

        if (lessonError) {
          console.error("Error creating lesson:", lessonError);
          continue;
        }

        const lessonId = lessonData[0].id;

        const subLessonsData =
          lesson.sub_lessons_attributes || lesson.sub_lessons || [];

        if (
          subLessonsData &&
          Array.isArray(subLessonsData) &&
          subLessonsData.length > 0
        ) {
          const subLessonsToInsert = subLessonsData.map(
            (subLesson, subIndex) => ({
              lesson_id: lessonId,
              title: subLesson.title || subLesson.name || "",
              video_url: subLesson.video_url || subLesson.videoUrl || "",
              mux_asset_id: subLesson.mux_asset_id || null,
              order_no: subLesson.order_no || subLesson.order || subIndex,
              created_at: bangkok,
              updated_at: bangkok,
            })
          );

          const { error: subLessonError } = await supabase
            .from("sub_lessons")
            .insert(subLessonsToInsert);

          if (subLessonError) {
            console.error("Error creating sub-lessons:", subLessonError);
          }
        }
      }
    }

    return NextResponse.json(
      {
        message: "Course created successfully",
        data: courseData,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error in courses-create API:", err);
    return NextResponse.json(
      {
        error: (err as Error).message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
