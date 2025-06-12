import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { FullAssignment } from '@/types/Assignments';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  const offset = (page - 1) * limit;

  try {
    const { data, error, count } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        description,
        start_date,
        end_date,
        solution,
        created_at,
        updated_at,
        sub_lessons (
            id,
            title,
            lessons (
                id,
                title,
                courses (
                    id,
                    name
                )
            )
        )
      `, { count: 'exact' })
      .ilike('description', `%${search}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching assignments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Helper function to safely extract nested name/title
    function getFirst(arrOrObj: any): any {
      if (Array.isArray(arrOrObj)) return arrOrObj.length > 0 ? arrOrObj[0] : undefined;
      if (arrOrObj && typeof arrOrObj === 'object') return arrOrObj;
      return undefined;
    }

    // Transform data into FullAssignment[]
    const assignments: FullAssignment[] = (data || []).map((item) => {
        const subLesson = getFirst(item.sub_lessons);
        const lesson = getFirst(subLesson?.lessons);
        const course = getFirst(lesson?.courses);

        return {
            id: item.id,
            title: item.title,
            description: item.description,
            solution: item.solution,
            start_date: item.start_date,
            end_date: item.end_date,
            created_at: item.created_at,
            updated_at: item.updated_at,
            course_id: course?.id ?? null,
            lesson_id: lesson?.id ?? null,
            sub_lesson_id: subLesson?.id ?? null,
            course_name: course?.name ?? '',
            lesson_name: lesson?.title ?? '',
            sub_lesson_name: subLesson?.title ?? '',
        };
    });

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      assignments,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
