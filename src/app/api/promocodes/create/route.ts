import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';
import { getBangkokISOString } from "@/lib/bangkokTime";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      min_purchase_amount,
      discount_type,
      discount_value,
      is_all_courses = false,
      course_ids = [],
    } = body;

    const { data: existingCodes, error: checkError } = await supabase
      .from('promo_codes')
      .select('id')
      .eq('code', code);

    if (checkError) {
      return Response.json({ error: checkError.message }, { status: 500 });
    }

    if (existingCodes && existingCodes.length > 0) {
      return Response.json(
        { error: 'Promo code already exists.' },
        { status: 400 }
      );
    }

    const { data: promoCode, error: promoError } = await supabase
      .from('promo_codes')
      .insert([
        {
          code,
          min_purchase_amount,
          discount_type,
          discount_value,
          is_all_courses,
          created_at: getBangkokISOString(),
          updated_at: getBangkokISOString(),
        },
      ])
      .select()
      .single();

    if (promoError) {
      return Response.json({ error: promoError.message }, { status: 500 });
    }

    if (!is_all_courses && Array.isArray(course_ids) && course_ids.length > 0) {
      const promo_code_id = promoCode.id;
      const rows = course_ids.map((course_id: string) => ({
        promo_code_id,
        course_id,
      }));

      const { error: courseError } = await supabase
        .from('promo_code_courses')
        .insert(rows);

      if (courseError) {
        await supabase.from('promo_codes').delete().eq('id', promo_code_id);
        return Response.json(
          { error: courseError.message },
          { status: 500 }
        );
      }
    }

return Response.json(
      {
        message: 'Promo code created successfully',
        promo_code: promoCode,
      },
      { status: 201 }
    );
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || 'Unknown error' },
      { status: 400 }
    );
  }
}
