import { NextRequest, NextResponse } from "next/server";
import Omise from "omise";

// สร้าง Omise instance
const omise = Omise({
  publicKey: process.env.NEXT_OMISE_PUBLIC_KEY,
  secretKey: process.env.NEXT_OMISE_SECRET_KEY,
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
    console.log(charge)
    // 2. ตรวจสอบผลลัพธ์
    if (charge.status === "successful") {
      // TODO: บันทึกข้อมูลการซื้อใน database ที่นี่ (mock)
      // เช่น await db.purchase.create({ ... })

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
