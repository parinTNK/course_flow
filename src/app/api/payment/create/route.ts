import { NextRequest, NextResponse } from "next/server";
import Omise from "omise";

const omise = Omise({
  publicKey: process.env.NEXT_PUBLIC_OMISE_KEY,
  secretKey: process.env.NEXT_PUBLIC_OMISE_SECRET_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, amount, courseId, userId, courseName, userName, promoCode } = body;
    
    const charge = await omise.charges.create({
      amount: amount * 100,
      currency: "thb",
      card: token,
      description: `Purchase: "${courseName}" by ${userName}` + (promoCode ? ` | Promo: ${promoCode}` : ""),
      metadata: { courseId, courseName, userId, userName, promoCode },
    });

    return NextResponse.json({ success: true, charge });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
