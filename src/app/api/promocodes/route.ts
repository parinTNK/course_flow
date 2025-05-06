import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase.from('promo_codes').select('*');
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json(data);
  } catch (err) {

    return Response.json(
      { error: (err as Error).message || 'Unknown error' },
      { status: 404 }
    );
  }
}






