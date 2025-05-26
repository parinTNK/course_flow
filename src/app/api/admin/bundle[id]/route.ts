import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import { BundleWithDetails, Course } from "@/types/bundle";
import { BundleIdSchema, type BundleIdParam } from "../bundle/bundle.schema";
import { z } from "zod";

// API Response type
interface GetBundleByIdResponse {
  data: BundleWithDetails;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<GetBundleByIdResponse | { error: string }>> {
  try {
    // Zod Validation for params
    const validatedParams: BundleIdParam = BundleIdSchema.parse(params);
    const { id } = validatedParams;

    const { data: bundle, error } = await supabase
      .from('bundles')
      .select(`
        *,
        bundle_courses (
          course_id,
          created_at,
          courses (
            id,
            name,
            price,
            summary,
            cover_image_url,
            total_learning_time,
            total_lessons,
            status
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
      }
      console.error("Error fetching bundle:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // คำนวณข้อมูลเพิ่มเติม
    const coursesPrice = bundle.bundle_courses?.reduce((total: number, bc: any) => 
      total + (bc.courses?.price || 0), 0) || 0;

    const totalLearningTime = bundle.bundle_courses?.reduce((total: number, bc: any) => 
      total + (bc.courses?.total_learning_time || 0), 0) || 0;

    const totalLessons = bundle.bundle_courses?.reduce((total: number, bc: any) => 
      total + (bc.courses?.total_lessons || 0), 0) || 0;

    const bundleWithDetails: BundleWithDetails = {
      ...bundle,
      courses_count: bundle.bundle_courses?.length || 0,
      courses_total_price: coursesPrice,
      discount_amount: coursesPrice - bundle.price,
      discount_percentage: coursesPrice > 0 ? 
        Math.round(((coursesPrice - bundle.price) / coursesPrice) * 100) : 0,
      total_learning_time: totalLearningTime,
      total_lessons: totalLessons,
      courses: bundle.bundle_courses?.map((bc: any) => bc.courses as Course) || []
    };

    const response: GetBundleByIdResponse = {
      data: bundleWithDetails
    };

    return NextResponse.json(response, { status: 200 });

  } catch (err) {
    // Zod Validation Error
    if (err instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid bundle ID format',
        details: err.errors
      }, { status: 400 });
    }

    console.error("Error in bundle GET by ID:", err);
    return NextResponse.json({
      error: (err as Error).message || 'Internal Server Error'
    }, { status: 500 });
  }
}