// app/api/promocodes/[id]/route.ts
import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`Deleting promo code with ID: ${id}`);
    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || 'Unknown error' },
      { status: 500 }
    );
  }
}
