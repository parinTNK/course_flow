import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const event = await req.json();

  if (
    (event.key === "charge.complete" || event.key === "charge.create") &&
    event.data.status === "successful"
  ) {

    const charge = event.data;
    const paymentDate = new Date(charge.paid_at).toISOString().replace(/\.\d{3}Z$/, "Z");

    let paymentMethod = "Unknown";
    if (charge.source && charge.source.type === "promptpay") {
      paymentMethod = "QR PromptPay";
    } else if (charge.card) {
      paymentMethod = `Credit card - ${charge.card.brand} - ${charge.card.last_digits}`;
    }


    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          user_id: charge.metadata.userId,
          course_id: charge.metadata.courseId,
          amount: charge.amount / 100,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: charge.status,
          charge_id: charge.id,
          failure_message: charge.failure_message || null,
        },
      ])
      .select()
      .single();

    if (paymentError) {
      console.error("DB insert error (payments):", paymentError);
      return NextResponse.json(
        { success: false, error: paymentError.message },
        { status: 500 }
      );
    }

    const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .upsert(
      [
        {
          user_id: charge.metadata.userId,
          course_id: charge.metadata.courseId,
          subscription_date: new Date().toISOString(),
          progress: 0,
          rating: null,
          review: null,
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

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ received: true });
}
