import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getBangkokISOString } from "@/lib/bangkokTime";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      courseId,
      userId,
      courseName,
      userName,
      paymentMethod,
      promoCode,
    } = body;

    const { data: existingPayment, error: paymentCheckError } = await supabase
      .from("payments")
      .select("id")
      .eq("course_id", courseId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existingPayment) {
      return NextResponse.json({ success: false, message: "Already purchased" }, { status: 409 });
    }

    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          user_id: userId,
          course_id: courseId,
          amount: 0,
          payment_date: getBangkokISOString(),
          payment_method: paymentMethod,
          created_at: getBangkokISOString(),
          updated_at: getBangkokISOString(),
          status: "successful",
          charge_id: null,
          failure_message: null,
        },
      ])
      .select()
      .single();



    if (paymentError) {
        console.error("DB insert error (payments):", paymentError);
      return NextResponse.json({ success: false, message: paymentError.message }, { status: 500 });
    }

    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .upsert(
        [
          {
            user_id: userId,
            course_id: courseId,
            subscription_date: getBangkokISOString(),
            progress: 0,
            rating: null,
            review: null,
          },
        ],
        { onConflict: "user_id,course_id" }
      );

    if (subscriptionError) {
      return NextResponse.json({ success: false, message: subscriptionError.message }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
