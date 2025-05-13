import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {

  const {id} = await params
  const courseId = id as string | undefined;

  if (!courseId) {
    return Response.json(
      { error: 'course_id is required' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, name, price')
      .eq('id', courseId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const course = data && data[0];

    if (!course) {
      return Response.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return Response.json(course);

  } catch (err) {
    return Response.json(
      { error: (err as Error).message || 'Unknown error' },
      { status: 500 }
    );
  }
}
