import { NextRequest, NextResponse } from "next/server";
import Omise from "omise";
import { validateAndCalculatePayment } from "@/lib/payment";
import { supabase } from "@/lib/supabaseClient";
import { getBangkokISOString } from "@/lib/bangkokTime";

const omise = Omise({
  publicKey: process.env.NEXT_PUBLIC_OMISE_KEY,
  secretKey: process.env.NEXT_PUBLIC_OMISE_SECRET_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseId, userId, userName, promoCode, expectedAmount } = body;

    const { course, finalAmount, discount, promoMeta, error } =
      await validateAndCalculatePayment({ courseId, promoCode });

    if (error) {
      return NextResponse.json(
        { success: false, message: error },
        { status: 404 }
      );
    }

    if (
      expectedAmount !== undefined &&
      Math.abs(finalAmount - expectedAmount) > 0.009
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "The price is incorrect. Please try again.",
          correctAmount: finalAmount,
        },
        { status: 409 }
      );
    }

    let query = supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("status", "pending")
      .eq("amount", finalAmount);

    if (promoMeta?.id) {
      query = query.eq("promo_code_id", promoMeta.id);
    } else {
      query = query.is("promo_code_id", null);
    }

    const { data: existingPayment } = await query.single();

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        charge: { id: existingPayment.charge_id },
        qr_image: existingPayment.qr_image,
        amount: existingPayment.amount,
        status: existingPayment.status,
      });
    }

    const source = await omise.sources.create({
      type: "promptpay",
      amount: finalAmount * 100,
      currency: "thb",
    });

    const charge = await omise.charges.create({
      amount: finalAmount * 100,
      currency: "thb",
      source: source.id,
      description:
        `Purchase: "${course.name}" by ${userName}` +
        (promoCode ? ` | Promo: ${promoCode}` : ""),
      metadata: {
        courseId,
        courseName: course.name,
        userId,
        promoCode,
        promoId: promoMeta?.id || null,
        discount,
      },
    });

    if (
      !charge.source ||
      !charge.source.scannable_code ||
      !charge.source.scannable_code.image ||
      !charge.source.scannable_code.image.download_uri
    ) {
      return NextResponse.json(
        { success: false, message: "QR code not available" },
        { status: 500 }
      );
    }

    await supabase.from("payments").insert([
      {
        user_id: userId,
        course_id: courseId,
        amount: finalAmount,
        payment_method: "QR PromptPay",
        promo_code_id: promoMeta?.id || null,
        created_at: getBangkokISOString(),
        updated_at: getBangkokISOString(),
        charge_id: charge.id,
        qr_image: charge.source.scannable_code.image.download_uri,
        status: "pending",
      },
    ]);

    return NextResponse.json({
      success: true,
      charge,
      qr_image: charge.source.scannable_code.image.download_uri,
      amount: finalAmount,
      status: "pending",
      qr_payload: (charge.source.scannable_code as any).data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
