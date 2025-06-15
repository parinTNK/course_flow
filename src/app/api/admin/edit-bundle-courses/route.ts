import { supabase } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface Course {
  id: string;
  name: string;
  price: number;
  summary?: string;
  status: 'active' | 'inactive';
  image_url?: string | null;
  lessons_count?: number | null;
}

export async function GET(req: NextRequest): Promise<NextResponse<Course[] | { error: string }>> {
  try {
    console.log("📚 [Edit Bundle] Fetching courses from Supabase...");

    // ดึงทุก courses ก่อน เพื่อดูว่ามีอะไรบ้าง
    const { data: allCourses, error: allError } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    console.log("🔍 [Edit Bundle] All courses in table:", allCourses?.length || 0);
    
    if (allCourses && allCourses.length > 0) {
      console.log("📋 [Edit Bundle] Sample course:", allCourses[0]);
      console.log("🏷️ [Edit Bundle] All status values:", [...new Set(allCourses.map(c => c.status))]);
    }

    // ดึง courses ที่ active
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        name,
        price,
        summary,
        status,
        cover_image_url
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ [Edit Bundle] Error fetching courses:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ [Edit Bundle] Active courses fetched:", data?.length || 0);

    // ถ้าไม่มี active courses ให้ลองดึงทั้งหมด
    if (!data || data.length === 0) {
      console.log("⚠️ [Edit Bundle] No active courses, trying all courses...");
      
      const { data: backupData, error: backupError } = await supabase
        .from('courses')
        .select(`
          id,
          name,
          price,
          summary,
          status,
          cover_image_url
        `)
        .order('created_at', { ascending: false });

      if (backupError) {
        console.error("❌ [Edit Bundle] Backup query error:", backupError);
        return NextResponse.json({ error: backupError.message }, { status: 500 });
      }

      console.log("🔄 [Edit Bundle] All courses as backup:", backupData?.length || 0);

      // ใช้ข้อมูลทั้งหมดแทน
      const formattedCourses: Course[] = (backupData || []).map(course => ({
        id: course.id,
        name: course.name,
        price: course.price || 0,
        summary: course.summary || "",
        status: course.status || 'active',
        image_url: course.cover_image_url,
        lessons_count: 0,
      }));

      return NextResponse.json(formattedCourses, { status: 200 });
    }

    // แปลงข้อมูลให้ตรงกับ interface
    const formattedCourses: Course[] = (data || []).map(course => ({
      id: course.id,
      name: course.name,
      price: course.price || 0,
      summary: course.summary || "",
      status: course.status,
      image_url: course.cover_image_url,
      lessons_count: 0,
    }));

    return NextResponse.json(formattedCourses, { status: 200 });

  } catch (error) {
    console.error("💥 [Edit Bundle] Error in courses API:", error);
    return NextResponse.json({
      error: (error as Error).message || 'Internal Server Error'
    }, { status: 500 });
  }
}