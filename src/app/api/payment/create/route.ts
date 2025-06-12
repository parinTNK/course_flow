import { NextRequest, NextResponse } from "next/server";
import { validateAndCalculatePayment } from "@/lib/payment";
import Omise from "omise";

const omise = Omise({
  publicKey: process.env.NEXT_PUBLIC_OMISE_KEY,
  secretKey: process.env.NEXT_PUBLIC_OMISE_SECRET_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, courseId, userId, userName, promoCode, expectedAmount } = body;

    const { course, finalAmount, discount, promoMeta, error } =
    await validateAndCalculatePayment({ courseId, promoCode });

    if (error) {
      return NextResponse.json({ success: false, message: error }, { status: 404 });
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

    const charge = await omise.charges.create({
      amount: finalAmount * 100,
      currency: "thb",
      card: token,
      description: `Purchase: "${course.name}" by ${userName}` +
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

    return NextResponse.json({ success: true, charge });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
