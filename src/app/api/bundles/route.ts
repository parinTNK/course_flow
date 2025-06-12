import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "active";

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build base query
    let query = supabase
      .from('bundles')
      .select('*')
      .eq('status', status);

    // Add search filter if provided
    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('bundles')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    // Get paginated results
    const { data: bundles, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Process bundles data
    const processedBundles = bundles?.map(bundle => ({
      ...bundle,
      courses_count: 0, // Will calculate later
      total_learning_time: 0 // Will calculate later
    })) || [];

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);

    return Response.json({
      bundles: processedBundles,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (err) {
    return Response.json(
      { error: (err as Error).message || 'Unknown error' },
      { status: 500 }
    );
  }
}