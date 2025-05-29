import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  const { data, error } = await supabase
    .from('promo_codes')
    .select(
      `
      *,
      promo_code_courses(
        courses(id, name)
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    return Response.json({ error: error?.message || 'Promo code not found' }, { status: 404 });
  }

  const course_ids = data.promo_code_courses
    ? data.promo_code_courses.map((rel: any) => rel.courses?.id).filter(Boolean)
    : [];
  const course_names = data.promo_code_courses
    ? data.promo_code_courses.map((rel: any) => rel.courses?.name).filter(Boolean)
    : [];

  const { promo_code_courses, ...rest } = data;

  console.log(rest)

  return Response.json({
    ...rest,
    course_ids,
    course_names,
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();

  const { course_ids, ...promoData } = body;

  const { error: updateError } = await supabase
    .from('promo_codes')
    .update(promoData)
    .eq('id', id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 400 });
  }


  await supabase.from('promo_code_courses').delete().eq('promo_code_id', id);


  if (Array.isArray(course_ids) && course_ids.length > 0) {
    const insertData = course_ids.map((course_id: string) => ({
      promo_code_id: id,
      course_id,
    }));
    const { error: insertError } = await supabase
      .from('promo_code_courses')
      .insert(insertData);

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 400 });
    }
  }

  return Response.json({ message: 'Promo code updated successfully' });
}

export async function DELETE(request: NextRequest,{ params }: {params: { id: string } }) {
  try {
    const { id } = params;
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