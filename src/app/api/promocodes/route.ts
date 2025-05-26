import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // ดึง promo_codes พร้อมทั้ง count และชื่อ courses ที่ใช้ได้กับแต่ละ promo code
    const { data, error } = await supabase
      .from('promo_codes')
      .select(`
        *,
        promo_code_courses(
          courses(name)
        )
      `);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // แปลงข้อมูลให้มี courses_count และ course_names และลบ promo_code_courses ออก
    const result = data.map((promo: any) => {
      const courses_count = promo.promo_code_courses ? promo.promo_code_courses.length : 0;
      const course_names = promo.promo_code_courses
        ? promo.promo_code_courses.map((rel: any) => rel.courses?.name).filter(Boolean)
        : [];
      // ลบ promo_code_courses ออกจาก object
      const { promo_code_courses, ...rest } = promo;
      return {
        ...rest,
        courses_count,
        course_names,
      };
    });

    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || 'Unknown error' },
      { status: 404 }
    );
  }
}
