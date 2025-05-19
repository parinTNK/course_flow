import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;

   
    const { data: existingCourse, error: fetchError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Delete course
    const { error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Course deleted successfully' }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}