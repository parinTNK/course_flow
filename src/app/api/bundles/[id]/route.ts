import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // เพิ่ม await เพื่อให้แน่ใจว่า params ถูก resolve
    const { id } = await params;
    const bundleId = id as string | undefined;

    console.log('🔍 Received bundle ID:', bundleId);

    if (!bundleId) {
      console.error('❌ Bundle ID is missing');
      return Response.json(
        { error: 'Bundle ID is required' },
        { status: 400 }
      );
    }

    // เพิ่มการตรวจสอบ format ของ bundleId
    if (typeof bundleId !== 'string' || bundleId.trim() === '') {
      console.error('❌ Invalid bundle ID format:', bundleId);
      return Response.json(
        { error: 'Invalid bundle ID format' },
        { status: 400 }
      );
    }

    console.log('📊 Querying Supabase for bundle:', bundleId);

    // Fetch bundle details with courses - ระบุ relationship ให้ชัดเจน
    const { data: bundleData, error: bundleError } = await supabase
      .from('bundles')
      .select(`
        *,
        bundle_courses!bundle_courses_bundle_id_fkey (
          course_id,
          created_at,
          courses (
            id,
            name,
            price,
            summary,
            cover_image_url,
            total_learning_time,
            lessons_count,
            status
          )
        )
      `)
      .eq('id', bundleId)
      .eq('status', 'active')
      .single();

    console.log('📊 Supabase query result:', { bundleData, bundleError });

    if (bundleError) {
      console.error('❌ Supabase error:', bundleError);
      
      if (bundleError.code === 'PGRST116') {
        return Response.json(
          { error: 'Bundle not found' }, 
          { status: 404 }
        );
      }
      
      // เพิ่มการจัดการ error codes อื่น ๆ
      if (bundleError.code === 'PGRST301') {
        return Response.json(
          { error: 'Database connection error' }, 
          { status: 503 }
        );
      }
      
      return Response.json(
        { error: `Database error: ${bundleError.message}` }, 
        { status: 500 }
      );
    }

    if (!bundleData) {
      console.error('❌ Bundle data is null');
      return Response.json(
        { error: 'Bundle not found' },
        { status: 404 }
      );
    }

    console.log('✅ Bundle found:', bundleData.name || bundleData.title);

    // Process courses from bundle_courses relationship
    const bundleCourses = bundleData.bundle_courses
      ?.map((bc: any) => bc.courses)
      .filter(Boolean) || [];

    console.log('📚 Bundle courses found:', bundleCourses.length);

    const coursesCount = bundleCourses.length;
    const totalLearningTime = bundleCourses.reduce(
      (total, course) => total + (course.total_learning_time || 0),
      0
    );

    // เพิ่มการตรวจสอบ required fields
    const response = {
      id: bundleData.id,
      name: bundleData.name,
      title: bundleData.title,
      description: bundleData.description,
      price: bundleData.price,
      cover_image_url: bundleData.cover_image_url,
      status: bundleData.status,
      created_at: bundleData.created_at,
      updated_at: bundleData.updated_at,
      // เพิ่ม fields อื่น ๆ ที่ต้องการ
      ...bundleData,
      courses: bundleCourses,
      courses_count: coursesCount,
      total_learning_time: totalLearningTime,
    };

    console.log('✅ Sending response with courses count:', coursesCount);
    
    return Response.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (err) {
    console.error('💥 Bundle API Error:', err);
    
    // เพิ่มการจัดการ error ที่ละเอียดขึ้น
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    
    return Response.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString(),
        bundleId: params?.id || 'unknown'
      },
      { status: 500 }
    );
  }
}