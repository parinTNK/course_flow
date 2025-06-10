import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getBangkokISOString } from "@/lib/bangkokTime";

let paymentId: string | undefined = undefined;

export async function POST(req: NextRequest) {
  const event = await req.json();

  if (
    (event.key === "charge.complete" || event.key === "charge.create") &&
    (event.data.status === "successful" || event.data.status === "failed" || event.data.status === "expired")
  ) {
    const charge = event.data;
    const paymentDate = getBangkokISOString(charge.paid_at);

    let paymentMethod = "Unknown";
    if (charge.source && charge.source.type === "promptpay") {
      paymentMethod = "QR PromptPay";
    } else if (charge.card) {
      paymentMethod = `Credit card - ${charge.card.brand} - ${charge.card.last_digits}`;
    }

    const { data: existingPayment, error: checkError } = await supabase
      .from("payments")
      .select("id")
      .eq("charge_id", charge.id)
      .maybeSingle();

    if (checkError) {
      console.error("DB check error (payments):", checkError);
      return NextResponse.json(
        { success: false, error: checkError.message },
        { status: 500 }
      );
    }

    if (existingPayment) {
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: charge.status,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          updated_at: getBangkokISOString(),
          failure_message: charge.failure_message || null,
          promo_code_id: charge.metadata.promoId || null,
        })
        .eq("charge_id", charge.id);

      if (updateError) {
        console.error("DB update error (payments):", updateError);
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }
      paymentId = existingPayment.id
    } else {
      const { data: paymentData, error: insertError } = await supabase
        .from("payments")
        .insert([
          {
            user_id: charge.metadata.userId,
            course_id: charge.metadata.courseId,
            amount: charge.amount / 100,
            payment_date: paymentDate,
            payment_method: paymentMethod,
            created_at: getBangkokISOString(),
            updated_at: getBangkokISOString(),
            status: charge.status,
            charge_id: charge.id,
            failure_message: charge.failure_message || null,
            promo_code_id: charge.metadata.promoId || null,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error("DB insert error (payments):", insertError);
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }
      paymentId = paymentData?.id;
    }

    if (event.data.status === "successful") {
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .upsert(
          [
            {
              user_id: charge.metadata.userId,
              course_id: charge.metadata.courseId,
              subscription_date: paymentDate,
              progress: 0,
              rating: null,
              review: null,
              payment_id: paymentId
            },
          ],
          { onConflict: "user_id,course_id" }
        );

      if (subscriptionError) {
        console.error("DB insert error (subscriptions):", subscriptionError);
        return NextResponse.json(
          { success: false, error: subscriptionError.message },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ received: true });
}