import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { code, amount } = await req.json();

  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { success: false, message: "Promo code not found" },
      { status: 404 }
    );
  }

  if (amount < data.min_purchase_amount) {
    return NextResponse.json(
      {
        success: false,
        message: `Minimum purchase amount is ${data.min_purchase_amount}`,
      },
      { status: 400 }
    );
  }

  // ตรวจสอบวันหมดอายุ, จำนวนครั้งที่ใช้ ฯลฯ (ถ้ามี field เหล่านี้)

  return NextResponse.json({ success: true, promo: data });
}
