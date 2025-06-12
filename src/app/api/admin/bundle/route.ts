import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import { BundleWithDetails, Course } from "@/types/bundle";
import { GetBundlesQuerySchema, type GetBundlesQuery } from "./bundle.schema";
import { z } from "zod";

// เพิ่ม interface สำหรับ Supabase response
interface SupabaseCourse {
  id: string;
  name: string;
  price: number | null;
  summary: string | null;
  cover_image_url: string | null;
  total_learning_time: number | null;
  total_lessons: number | null;
  status: 'active' | 'inactive';
}

interface BundleCourseWithCourse {
  bundle_id: string;
  course_id: string;
  courses: SupabaseCourse | null;
}

// API Response type
interface GetBundlesResponse {
  data: BundleWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function GET(req: NextRequest): Promise<NextResponse<GetBundlesResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(req.url);
    
    // แปลง searchParams เป็น object สำหรับ Zod validation
    const queryParams = {
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined
    };

    // Zod Validation
    const validatedQuery: GetBundlesQuery = GetBundlesQuerySchema.parse(queryParams);
    const { status, page, limit } = validatedQuery;
    
    const offset = (page - 1) * limit;

    // Query 1: ดึง bundles พร้อม count
    const { data: bundles, error: bundlesError, count } = await supabase
      .from('bundles')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (bundlesError) {
      console.error("Error fetching bundles:", bundlesError);
      return NextResponse.json({ error: bundlesError.message }, { status: 500 });
    }

    // ถ้าไม่มี bundles ให้ return empty array
    if (!bundles || bundles.length === 0) {
      const response: GetBundlesResponse = {
        data: [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
      return NextResponse.json(response, { status: 200 });
    }

    // Query 2: ดึง bundle_courses (แค่ IDs)
    const bundleIds = bundles.map(bundle => bundle.id);
    
    const { data: bundleCourses, error: bundleCoursesError } = await supabase
      .from('bundle_courses')
      .select('bundle_id, course_id')
      .in('bundle_id', bundleIds);

    if (bundleCoursesError) {
      console.error("Error fetching bundle courses:", bundleCoursesError);
      return NextResponse.json({ error: bundleCoursesError.message }, { status: 500 });
    }

    // ถ้าไม่มี bundle_courses ให้ return bundles เปล่า
    if (!bundleCourses || bundleCourses.length === 0) {
      const bundlesWithStats: BundleWithDetails[] = bundles.map(bundle => ({
        ...bundle,
        courses_count: 0,
        courses_total_price: 0,
        discount_amount: 0,
        discount_percentage: 0,
        total_learning_time: 0,
        total_lessons: 0,
        courses: []
      }));

      const response: GetBundlesResponse = {
        data: bundlesWithStats,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
      return NextResponse.json(response, { status: 200 });
    }

    // Query 3: ดึง courses โดยแยกสมบูรณ์
    const courseIds = bundleCourses.map(bc => bc.course_id);
    
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id,
        name,
        price,
        summary,
        cover_image_url,
        total_learning_time,
        total_lessons,
        status
      `)
      .in('id', courseIds) as { 
        data: SupabaseCourse[] | null; 
        error: any; 
      };

    if (coursesError) {
      console.error("Error fetching courses:", coursesError);
      return NextResponse.json({ error: coursesError.message }, { status: 500 });
    }

    // แปลงข้อมูลให้ตรงกับ BundleWithDetails type
    const bundlesWithStats: BundleWithDetails[] = bundles.map(bundle => {
      // หา course IDs ที่เป็นของ bundle นี้
      const bundleCourseIds = bundleCourses?.filter(bc => bc.bundle_id === bundle.id).map(bc => bc.course_id) || [];
      
      // หา courses ที่เป็นของ bundle นี้
      const bundleCoursesList = courses?.filter(course => course && bundleCourseIds.includes(course.id)) || [];
      
      // คำนวณข้อมูลสถิติ
      const coursesPrice = bundleCoursesList.reduce((total, course) => {
        const price = course.price;
        return total + (price || 0);
      }, 0);
      
      const totalLearningTime = bundleCoursesList.reduce((total, course) => {
        const learningTime = course.total_learning_time;
        return total + (learningTime || 0);
      }, 0);
      
      const totalLessons = bundleCoursesList.reduce((total, course) => {
        const lessons = course.total_lessons;
        return total + (lessons || 0);
      }, 0);
      
      return {
        ...bundle,
        courses_count: bundleCoursesList.length,
        courses_total_price: coursesPrice,
        discount_amount: coursesPrice - bundle.price,
        discount_percentage: coursesPrice > 0 ? 
          Math.round(((coursesPrice - bundle.price) / coursesPrice) * 100) : 0,
        total_learning_time: totalLearningTime,
        total_lessons: totalLessons,
        courses: bundleCoursesList.map(course => ({
          id: course.id,
          name: course.name,
          price: course.price || undefined,
          summary: course.summary || undefined,
          cover_image_url: course.cover_image_url || undefined,
          total_learning_time: course.total_learning_time || undefined,
          total_lessons: course.total_lessons || undefined,
          status: course.status
        } as Course))
      };
    });

    const response: GetBundlesResponse = {
      data: bundlesWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (err) {
    // Zod Validation Error
    if (err instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        details: err.errors
      }, { status: 400 });
    }

    console.error("Error in bundles GET API:", err);
    return NextResponse.json({
      error: (err as Error).message || 'Internal Server Error'
    }, { status: 500 });
  }
}