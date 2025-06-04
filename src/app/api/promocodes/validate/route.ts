import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';


export async function POST(req: NextRequest) {
  const { code, courseId, amount } = await req.json();


  const { data: promo, error: promoError } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .single();

  if (promoError || !promo) {
    return Response.json({ valid: false, message: "Promo code not found" });
  }


  const { data: mapping, error: mappingError } = await supabase
    .from("courses")
    .select("id, promo_code_id")
    .eq("id", courseId)
    .eq("promo_code_id", promo.id)
    .single();

  if (mappingError || !mapping) {
    return Response.json({
      valid: false,
      message: "This promo code cannot be used with this course.",
    });
  }


  if (amount < promo.min_purchase_amount) {
    return Response.json({
      valid: false,
      message: `Minimum purchase amount is ${promo.min_purchase_amount}`,
    });
  }


  return Response.json({
    valid: true,
    discountType: promo.discount_type,
    discountValue: promo.discount_value,
    promoCodeId: promo.id,
    message: "Promo code applied!",
  });
}