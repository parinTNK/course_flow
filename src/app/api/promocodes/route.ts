import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';

    const from = (page - 1) * limit;
    const to = from + limit - 1;


    let query = supabase
      .from('promo_codes')
      .select(
        `
        *,
        promo_code_courses(
          courses(name)
        )
      `,
        { count: 'exact' }
      );

    if (search) {
      query = query.ilike('code', `%${search}%`);
    }

    query = query.order('updated_at', { ascending: false }).order('id', { ascending: false }).range(from, to);


    const { data, error, count } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const result = data.map((promo: any) => {
      const courses_count = promo.promo_code_courses
        ? promo.promo_code_courses.length
        : 0;
      const course_names = promo.promo_code_courses
        ? promo.promo_code_courses
            .map((rel: any) => rel.courses?.name)
            .filter(Boolean)
        : [];
      const { promo_code_courses, ...rest } = promo;
      return {
        ...rest,
        courses_count,
        course_names,
      };
    });

    return Response.json({
      data: result,
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || 'Unknown error' },
      { status: 404 }
    );
  }
}
