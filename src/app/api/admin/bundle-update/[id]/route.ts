// /api/admin/bundle-update/[id]/route.ts - แบบง่าย
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getBangkokISOString } from '@/lib/bangkokTime';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const bundleId = params.id;
  
  console.log("📝 Updating bundle:", bundleId);

  try {
    const body = await req.json();
    const { name, price, description, detail } = body;

    console.log("📥 Update data:", { name, price, description, detail });

    // Basic validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Bundle name is required" },
        { status: 400 }
      );
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 }
      );
    }

    // อัปเดต bundle
    const { data, error } = await supabase
      .from("bundles")
      .update({
        name: name.trim(),
        price: parseFloat(price),
        description: description?.trim() || '',
        detail: detail?.trim() || '',
        updated_at: getBangkokISOString()
      })
      .eq("id", bundleId)
      .select("*")
      .single();

    if (error) {
      console.error("❌ Update error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Bundle updated successfully");

    return NextResponse.json({ 
      success: true, 
      data: data 
    });

  } catch (error) {
    console.error("💥 Update error:", error);
    return NextResponse.json(
      { error: "Failed to update bundle" },
      { status: 500 }
    );
  }
}