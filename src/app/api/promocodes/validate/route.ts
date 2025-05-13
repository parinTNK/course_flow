import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';


export async function POST(req: NextRequest) {
  const { code, courseId, amount } = await req.json();

  // 1. หา promo code ใน database
  const { data: promo, error: promoError } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .single();

  if (promoError || !promo) {
    return Response.json({ valid: false, message: "Promo code not found" });
  }

  // 2. เช็คว่า promo code นี้ใช้กับ course นี้ได้หรือไม่ (table กลาง)
  const { data: mapping, error: mappingError } = await supabase
    .from("promo_code_courses")
    .select("*")
    .eq("promo_code_id", promo.id)
    .eq("course_id", courseId)
    .single();

  if (mappingError || !mapping) {
    return Response.json({
      valid: false,
      message: "This promo code cannot be used with this course.",
    });
  }

  // 3. เช็ค min_purchase_amount
  if (amount < promo.min_purchase_amount) {
    return Response.json({
      valid: false,
      message: `Minimum purchase amount is ${promo.min_purchase_amount}`,
    });
  }

  // 4. คืนข้อมูล discount
  return Response.json({
    valid: true,
    discountType: promo.discount_type, // "THB" หรือ "PERCENT"
    discountValue: promo.discount_value,
    discountPercentage: promo.discount_percentage,
    promoCodeId: promo.id,
    message: "Promo code applied!",
  });
}