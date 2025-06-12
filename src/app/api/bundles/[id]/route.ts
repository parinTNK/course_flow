import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const bundleId = id as string | undefined;

  if (!bundleId) {
    return Response.json(
      { error: 'bundle_id is required' },
      { status: 400 }
    );
  }

  try {
    // Fetch bundle details
    const { data: bundleData, error: bundleError } = await supabase
      .from('bundles')
      .select('*')
      .eq('id', bundleId)
      .eq('status', 'active')
      .single();

    if (bundleError) {
      return Response.json({ error: bundleError.message }, { status: 500 });
    }

    if (!bundleData) {
      return Response.json(
        { error: 'Bundle not found' },
        { status: 404 }
      );
    }

    const bundleCourses: any[] = [];
    
    const coursesCount = bundleCourses.length;
    const totalLearningTime = bundleCourses.reduce(
      (total, course) => total + (course.total_learning_time || 0),
      0
    );

    const response = {
      ...bundleData,
      courses: bundleCourses,
      courses_count: coursesCount,
      total_learning_time: totalLearningTime,
    };

    return Response.json(response);

  } catch (err) {
    return Response.json(
      { error: (err as Error).message || 'Unknown error' },
      { status: 500 }
    );
  }
}