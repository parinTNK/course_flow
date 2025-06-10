import { supabase } from "@/lib/supabaseClient";
import { DISCOUNT_TYPE_FIXED,DISCOUNT_TYPE_PERCENT } from "@/types/promoCode";

export async function validateAndCalculatePayment({
  courseId,
  promoCode,
}: {
  courseId: string;
  promoCode?: string;
}) {
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, name, price")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    return { error: "Course not found" };
  }

  let finalAmount = course.price;
  let discount = 0;
  let promoMeta: any = null;

  if (promoCode) {
    const { data: promo, error: promoError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", promoCode)
      .single();

    if (!promoError && promo) {
      const { data: mapping } = await supabase
        .from("courses")
        .select("id, promo_code_id")
        .eq("id", courseId)
        .eq("promo_code_id", promo.id)
        .single();

      if (
        mapping &&
        (!promo.min_purchase_amount || finalAmount >= promo.min_purchase_amount)
      ) {
        if (promo.discount_type === DISCOUNT_TYPE_FIXED) {
          discount = promo.discount_value;
        } else if (promo.discount_type === DISCOUNT_TYPE_PERCENT) {
          discount = (finalAmount * promo.discount_value) / 100;
        }
        promoMeta = promo;
      }
    }
  }

  finalAmount = Math.max(0, Math.round((finalAmount - discount) * 100) / 100);

  return {
    course,
    finalAmount,
    discount,
    promoMeta,
    error: null,
  };
}
