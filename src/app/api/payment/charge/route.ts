import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/lib/supabaseClient';
import Omise from "omise";

// สร้าง Omise instance
const omise = Omise({
  publicKey: process.env.NEXT_PUBLIC_OMISE_KEY,
  secretKey: process.env.NEXT_PUBLIC_OMISE_SECRET_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, amount, email, courseId, userId } = body;

    // 1. สร้าง charge กับ Omise
    const charge = await omise.charges.create({
      amount: amount * 100, // Omise ใช้หน่วยสตางค์
      currency: "thb",
      card: token,
      description: `Purchase course ${courseId} by user ${userId}`,
      metadata: { courseId, userId, email },
    });
    // 2. ตรวจสอบผลลัพธ์
    if (charge.status === "successful") {

      // const { error: paymentError } = await supabase.from("payments").insert([
      //   {
      //     user_id: userId,
      //     course_id: courseId,
      //     amount: charge.amount / 100,
      //     payment_date: new Date(charge.paid_at * 1000),
      //     payment_method: charge.funding_instrument,
      //     promo_code_id: null,
      //     created_at: new Date(),
      //     updated_at: new Date(),
      //     status: charge.status,
      //     charge_id: charge.id,
      //     failure_message: charge.failure_message || null,
      //   },
      // ]);

      // if (paymentError) {
      //   return NextResponse.json(
      //     { success: false, message: paymentError.message },
      //     { status: 500 }
      //   );
      // }

      return NextResponse.json({ success: true, charge });
    } else {
      return NextResponse.json(
        { success: false, message: "Payment failed", charge },
        { status: 400 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
