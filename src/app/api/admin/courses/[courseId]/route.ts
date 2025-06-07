import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const { courseId } = await params;
        
  if (!courseId) {
    return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
  }

  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        lessons:lessons(
          id, 
          title, 
          course_id, 
          order_no,
          sub_lessons!inner(
            id, 
            title, 
            video_url, 
            mux_asset_id,
            lesson_id, 
            order_no
          )
        )
      `)
      .eq('id', courseId)
      .order('order_no', { foreignTable: 'lessons', ascending: true })
      .order('order_no', { foreignTable: 'lessons.sub_lessons', ascending: true })
      .single();

    if (error) {
      console.error('Error fetching course with nested data:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const lessonWithSubLessons = course?.lessons?.map(lesson => ({
      ...lesson,
      name: lesson.title,
      order: lesson.order_no,
      sub_lessons: lesson.sub_lessons?.map(sl => ({
        ...sl,
        name: sl.title,
        order: sl.order_no,
        videoUrl: sl.video_url,
        video_url: sl.video_url,
        mux_asset_id: sl.mux_asset_id
      })) || []
    })) || [];

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const formattedCourse = {
      ...course,
      lessons: lessonWithSubLessons,
      lessons_attributes: lessonWithSubLessons.map(lesson => ({
        ...lesson,
        sub_lessons_attributes: lesson.sub_lessons || []
      }))
    };

    return NextResponse.json(formattedCourse);
  } catch (error: any) {
    console.error('Error in GET /api/admin/courses/[courseId]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
