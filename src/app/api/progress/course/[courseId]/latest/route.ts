import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const supabase_client = createServerComponentClient({ cookies });
        const { data: { user } } = await supabase_client.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { courseId } = await params;
        const { data: latestProgress, error } = await supabase_client
            .from('sub_lesson_progress')
            .select(`
                sub_lesson_id,
                watch_time,
                status,
                updated_at,
                sub_lessons!inner(
                    id,
                    title,
                    video_url,
                    order_no,
                    duration,
                    lessons!inner(
                        id,
                        title,
                        course_id,
                        order_no
                    )
                )
            `)
            .eq('user_id', user.id)
            .eq('sub_lessons.lessons.course_id', courseId)
            .neq('status', 'not_started')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: 'Failed to fetch latest progress' }, { status: 500 });
        }
        if (!latestProgress) {
            return NextResponse.json({
                hasProgress: false,
                latestSubLesson: null
            });
        }
        const subLesson = latestProgress.sub_lessons;
        const lesson = subLesson.lessons;
        return NextResponse.json({
            hasProgress: true,
            latestSubLesson: {
                id: latestProgress.sub_lesson_id,
                title: subLesson.title,
                video_url: subLesson.video_url,
                order_no: subLesson.order_no,
                duration: subLesson.duration,
                lesson_title: lesson.title,
                lesson_order_no: lesson.order_no,
                watch_time: latestProgress.watch_time,
                status: latestProgress.status,
                updated_at: latestProgress.updated_at
            }
        });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
