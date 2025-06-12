import { NextRequest, NextResponse } from "next/server";
import Omise from "omise";

const omise = Omise({
  publicKey: process.env.NEXT_PUBLIC_OMISE_KEY,
  secretKey: process.env.NEXT_PUBLIC_OMISE_SECRET_KEY,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chargeId = searchParams.get("chargeId");

  if (!chargeId) {
    return NextResponse.json(
      { success: false, message: "Missing chargeId" },
      { status: 400 }
    );
  }

  try {
    const charge = await omise.charges.retrieve(chargeId);

    return NextResponse.json({
      success: true,
      status: charge.status,
      charge,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
