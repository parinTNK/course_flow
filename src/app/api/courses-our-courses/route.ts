import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '10', 10);
        const searchTerm = url.searchParams.get('search') || '';
        const status = url.searchParams.get('status') || 'published'; // default to published

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        // Get total count with filters
        const { count, error: countError } = await supabase
            .from('courses')
            .select('id', { count: 'exact', head: true })
            .ilike('name', `%${searchTerm}%`)
            .eq('status', status);

        if (countError) {
            console.error('Error getting count:', countError.message);
            return Response.json({ error: countError.message }, { status: 400 });
        }

        // Get paginated data with filters
        const { data, error } = await supabase
            .from('courses')
            .select(`
                id,
                name,
                price,
                total_learning_time,
                summary,
                detail,
                promo_code_id,
                cover_image_url, 
                video_trailer_url,
                attachment_url,
                created_at,
                updated_at,
                published_at,
                status,
                lessons ( * ) 
            `)
            .ilike('name', `%${searchTerm}%`)
            .eq('status', status)
            .range(from, to)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error fetching courses with lessons:', error.message);
            return Response.json({ error: error.message }, { status: 400 });
        }

        if (!data) {
            return Response.json({
                courses: [],
                pagination: {
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: page,
                    limit: limit
                }
            }, { status: 200 });
        }

        // Format data for frontend
        const formattedData = data.map(course => {
            const actualLessons = Array.isArray(course.lessons) ? course.lessons : [];
            const lessonsCount = actualLessons.length;
            const { cover_image_url, lessons, ...restOfCourse } = course;
            return {
                ...restOfCourse,
                image_url: cover_image_url,
                lessons_count: lessonsCount,
                lessons: actualLessons,
            };
        });

        const totalItems = count || 0;
        const totalPages = Math.ceil(totalItems / limit);

        return Response.json({
            courses: formattedData,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        }, { status: 200 });

    } catch (e) {
        console.error('Server error in GET /api/courses-our-courses:', (e as Error).message);
        return Response.json(
            { error: (e as Error).message || 'Unknown error' },
            { status: 500 }
        );
    }
}

