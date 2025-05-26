import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getBangkokISOString } from '@/lib/bangkokTime';

export const runtime = 'nodejs';

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
            lessons 
        } = body;

        const lessonsData = lessons_attributes || lessons;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!name) {
            return NextResponse.json({ error: 'Course name is required' }, { status: 400 });
        }

        if (name.length < 10) {
            return NextResponse.json({ error: 'Course name must be at least 10 characters long' }, { status: 400 });
        }

        const bangkok = getBangkokISOString();

        // 1. สร้าง course ก่อน
        const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .insert({
                name,
                summary: summary || '',
                detail: detail || '',
                price: price || 0,
                total_learning_time: total_learning_time || 0,
                cover_image_url: cover_image_url || '',
                video_trailer_mux_asset_id: video_trailer_mux_asset_id || null,
                video_trailer_url: video_trailer_url || null,
                status: status || 'draft',
                created_at: bangkok,
                updated_at: bangkok
            })
            .select();

        if (courseError) {
            return NextResponse.json({ error: courseError.message }, { status: 500 });
        }

        const courseId = courseData[0].id;

        // 2. ถ้ามี lessons ให้สร้าง lessons
        if (lessonsData && Array.isArray(lessonsData) && lessonsData.length > 0) {
            for (let i = 0; i < lessonsData.length; i++) {
                const lesson = lessonsData[i];
                
                // 2.1 สร้าง lesson
                const { data: lessonData, error: lessonError } = await supabase
                    .from('lessons')
                    .insert({
                        course_id: courseId,
                        title: lesson.title || lesson.name || '',
                        order_no: lesson.order_no || lesson.order || i + 1,
                        created_at: bangkok,
                        updated_at: bangkok
                    })
                    .select();

                if (lessonError) {
                    console.error("Error creating lesson:", lessonError);
                    continue;  // แม้ error ก็ให้ทำงานต่อกับ lesson อื่น
                }

                const lessonId = lessonData[0].id;

                // 2.2 ถ้ามี sub_lessons ให้สร้าง sub_lessons
                const subLessonsData = lesson.sub_lessons_attributes || lesson.sub_lessons || [];
                
                if (subLessonsData && Array.isArray(subLessonsData) && subLessonsData.length > 0) {
                    const subLessonsToInsert = subLessonsData.map((subLesson, subIndex) => ({
                        lesson_id: lessonId,
                        title: subLesson.title || subLesson.name || '',
                        video_url: subLesson.video_url || subLesson.videoUrl || '',
                        mux_asset_id: subLesson.mux_asset_id || null,
                        order_no: subLesson.order_no || subLesson.order || subIndex,
                        created_at: bangkok,
                        updated_at: bangkok
                    }));

                    const { error: subLessonError } = await supabase
                        .from('sub_lessons')
                        .insert(subLessonsToInsert);

                    if (subLessonError) {
                        console.error("Error creating sub-lessons:", subLessonError);
                    }
                }
            }
        }

        return NextResponse.json({ 
            message: 'Course created successfully',
            data: courseData 
        }, { status: 201 });
    } catch (err) {
        console.error("Error in courses-create API:", err);
        return NextResponse.json({ 
            error: (err as Error).message || 'Internal Server Error' 
        }, { status: 500 });
    }
}