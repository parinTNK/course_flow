import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getBangkokISOString } from '@/lib/bangkokTime';
import { BundleWithDetails, Course } from '@/types/bundle';
import { CreateBundleSchema, type CreateBundleInput } from '../bundle/bundle.schema';
import { z } from 'zod';

export const runtime = 'nodejs';

// API Response type
interface CreateBundleResponse {
  message: string;
  data: BundleWithDetails;
}

export async function POST(req: NextRequest): Promise<NextResponse<CreateBundleResponse | { error: string }>> {
  console.log("🚀 Create Bundle API called");
  
  try {
    const body = await req.json();
    console.log("📝 Request body:", body);
    
    // Zod Validation
    const validatedData: CreateBundleInput = CreateBundleSchema.parse(body);
    console.log("✅ Validated data:", validatedData);
    
    const {
      name,
      description,
      detail,
      price,
      courses
    } = validatedData;

    const bangkok = getBangkokISOString();

    // 1. สร้าง bundle
    const { data: bundleData, error: bundleError } = await supabase
      .from('bundles')
      .insert({
        name,
        description,
        detail,
        price,
        status: 'active', // เพิ่ม status
        created_at: bangkok,
        updated_at: bangkok
      })
      .select();

    if (bundleError) {
      console.error("❌ Error creating bundle:", bundleError);
      return NextResponse.json({ error: bundleError.message }, { status: 500 });
    }

    console.log("✅ Bundle created:", bundleData[0]);
    const bundleId = bundleData[0].id;

    // 2. ถ้ามี courses ที่ต้องการเพิ่มเข้า bundle
    if (courses && courses.length > 0) {
      console.log("📚 Adding courses to bundle:", courses);
      
      const bundleCoursesToInsert = courses.map(courseId => ({
        bundle_id: bundleId,
        course_id: courseId,
        created_at: bangkok
      }));

      const { error: bundleCoursesError } = await supabase
        .from('bundle_courses')
        .insert(bundleCoursesToInsert);

      if (bundleCoursesError) {
        console.error("❌ Error adding courses:", bundleCoursesError);
        
        // ลบ bundle ที่สร้างไว้ก่อน
        await supabase.from('bundles').delete().eq('id', bundleId);

        // เช็ค error type
        if (bundleCoursesError.code === '23503') {
          return NextResponse.json({
            error: 'One or more courses not found'
          }, { status: 404 });
        }
        
        return NextResponse.json({
          error: 'Failed to add courses to bundle'
        }, { status: 500 });
      }
      
      console.log("✅ Courses added successfully");
    }

    // ดึงข้อมูล bundle พร้อม courses
    const { data: completeBundleData, error: fetchError } = await supabase
      .from('bundles')
      .select(`
        *,
        bundle_courses (
          course_id,
          courses (*)
        )
      `)
      .eq('id', bundleId)
      .single();

    if (fetchError) {
      console.error("❌ Error fetching complete bundle:", fetchError);
      return NextResponse.json({ error: 'Failed to fetch created bundle' }, { status: 500 });
    }

    // แปลงข้อมูลให้ตรงกับ BundleWithDetails type
    const coursesPrice = completeBundleData.bundle_courses?.reduce((total: number, bc: any) => 
      total + (bc.courses?.price || 0), 0) || 0;

    const totalLearningTime = completeBundleData.bundle_courses?.reduce((total: number, bc: any) => 
      total + (bc.courses?.total_learning_time || 0), 0) || 0;

    const totalLessons = completeBundleData.bundle_courses?.reduce((total: number, bc: any) => 
      total + (bc.courses?.total_lessons || 0), 0) || 0;

    const bundleWithDetails: BundleWithDetails = {
      ...completeBundleData,
      courses_count: completeBundleData.bundle_courses?.length || 0,
      courses_total_price: coursesPrice,
      discount_amount: coursesPrice - completeBundleData.price,
      discount_percentage: coursesPrice > 0 ? 
        Math.round(((coursesPrice - completeBundleData.price) / coursesPrice) * 100) : 0,
      total_learning_time: totalLearningTime,
      total_lessons: totalLessons,
      courses: completeBundleData.bundle_courses?.map((bc: any) => bc.courses as Course) || []
    };

    console.log("🎉 Bundle creation completed successfully");

    return NextResponse.json({
      message: 'Bundle created successfully',
      data: bundleWithDetails
    }, { status: 201 });

  } catch (err) {
    // Zod Validation Error
    if (err instanceof z.ZodError) {
      console.error("❌ Validation error:", err.errors);
      return NextResponse.json({
        error: 'Validation failed',
        details: err.errors
      }, { status: 400 });
    }

    console.error("❌ Error in bundle-create API:", err);
    return NextResponse.json({
      error: (err as Error).message || 'Internal Server Error'
    }, { status: 500 });
  }
}