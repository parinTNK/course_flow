import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import Omise from "omise";

const omise = Omise({
  publicKey: process.env.NEXT_PUBLIC_OMISE_KEY,
  secretKey: process.env.NEXT_PUBLIC_OMISE_SECRET_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { amount, courseId, userId } = await req.json();

    // 1. สร้าง Source สำหรับ QR PromptPay
    const source = await omise.sources.create({
      type: "promptpay",
      amount: amount * 100, // หน่วยสตางค์
      currency: "thb",
    });

    // 2. สร้าง Charge จาก Source
    const charge = await omise.charges.create({
      amount: amount * 100,
      currency: "thb",
      source: source.id,
      description: `Purchase course ${courseId} by user ${userId}`,
      metadata: { courseId, userId },
    });

    // 3. เช็คว่ามี source และ scannable_code จริง
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

    // 4. ส่งข้อมูล QR code กลับไป frontend
    return NextResponse.json({
      success: true,
      charge,
      qr_image: charge.source.scannable_code.image.download_uri,
      qr_payload: (charge.source.scannable_code as any).data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
