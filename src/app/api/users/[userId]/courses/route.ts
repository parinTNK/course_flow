import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  if (!userId) {
    return Response.json(
      { error: 'user_id is required' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      id,
      course_id,
      subscription_date,
      progress,
      rating,
      review,
      courses (
        id,
        name,
        price,
        total_learning_time,
        summary,
        cover_image_url,
        status,
        lessons (
          id,
          course_id,
          title,
          order_no,
          created_at,
          updated_at
        )
      )
    `)
    .eq('user_id', userId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const courses = (data  || [])
    .filter((row) => row.courses)
    .map((row) => ({
      subscriptions_id: row.id,
      progress: row.progress,
      ...row.courses,
    }));


    return Response.json(courses);
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || 'Unknown error' },
      { status: 500 }
    );
  }
}
