import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '10', 10);
        const searchTerm = url.searchParams.get('search') || '';
        
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { count, error: countError } = await supabase
            .from('courses')
            .select('id', { count: 'exact', head: true })
            .ilike('name', `%${searchTerm}%`);

        if (countError) {
            console.error('Error getting count:', countError.message);
            return Response.json(
                { error: countError.message },
                { status: 400 }
            );
        }
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
            .eq('status', 'published')
            .ilike('name', `%${searchTerm}%`)
            .range(from, to)
            .order('updated_at', { ascending: false });
            //TODO: check with team if we need to order by created_at or updated_at [how to order?]

        if (error) {
            console.error('Supabase error fetching courses with lessons:', error.message);
            return Response.json(
                { error: error.message },
                { status: 400 }
            );
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
        console.error('Server error in GET /api/courses-list:', (e as Error).message);
        return Response.json(
            { error: (e as Error).message || 'Unknown error' },
            { status: 500 }
        );
    }
}

