
import { supabase } from "@/lib/supabaseClient";

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
        .from("promo_code_courses")
        .select("*")
        .eq("promo_code_id", promo.id)
        .eq("course_id", courseId)
        .single();

      if (
        mapping &&
        (!promo.min_purchase_amount ||
          finalAmount >= promo.min_purchase_amount)
      ) {
        if (promo.discount_type === "THB") {
          discount = promo.discount_value;
        } else if (promo.discount_type === "percentage") {
          discount = (finalAmount * promo.discount_percentage) / 100;
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
