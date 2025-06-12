import { supabase } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { data: promoCodes, error } = await supabase
      .from('promo_codes')
      .select('id, code, min_purchase_amount, discount_type, discount_value, discount_percentage');

    if (error) {
      console.error('Error fetching promo codes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(promoCodes);
  } catch (error: any) {
    console.error('GET Promo Codes API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch promo codes' }, { status: 500 });
  }
}
