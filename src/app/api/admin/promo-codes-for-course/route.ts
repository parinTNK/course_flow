import { supabase } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const mode = searchParams.get('mode');

    if (!courseId && mode === 'edit') {
      return NextResponse.json({ error: 'Course ID is required for edit mode' }, { status: 400 });
    }

    let promoCodes: any[] = [];

    if (mode === 'create') {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('id, code, min_purchase_amount, discount_type, discount_value')
        .eq('is_all_courses', true)
        .order('code');

      if (error) {
        console.error('Error fetching promo codes for create:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      promoCodes = data || [];
    } else if (mode === 'edit' && courseId) {
      
      const { data: allCoursesPromos, error: allCoursesError } = await supabase
        .from('promo_codes')
        .select('id, code, min_purchase_amount, discount_type, discount_value')
        .eq('is_all_courses', true);

      if (allCoursesError) {
        console.error('Error fetching all courses promo codes:', allCoursesError);
        return NextResponse.json({ error: allCoursesError.message }, { status: 500 });
      }

      const { data: courseSpecificPromos, error: courseSpecificError } = await supabase
        .from('promo_code_courses')
        .select(`
          promo_codes!inner(
            id, code, min_purchase_amount, discount_type, discount_value
          )
        `)
        .eq('course_id', courseId);

      if (courseSpecificError) {
        console.error('Error fetching course-specific promo codes:', courseSpecificError);
        return NextResponse.json({ error: courseSpecificError.message }, { status: 500 });
      }

      const allPromosMap = new Map();
      
      (allCoursesPromos || []).forEach(promo => {
        allPromosMap.set(promo.id, promo);
      });

      (courseSpecificPromos || []).forEach((item: any) => {
        if (item.promo_codes) {
          allPromosMap.set(item.promo_codes.id, item.promo_codes);
        }
      });

      promoCodes = Array.from(allPromosMap.values()).sort((a, b) => a.code.localeCompare(b.code));
    }

    return NextResponse.json({ promoCodes });
  } catch (error: any) {
    console.error('GET Promo Codes for Course API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch promo codes' }, { status: 500 });
  }
}
