import { supabase } from '@/lib/supabaseClient';

type Lesson = {
  id: string;
  course_id: string;
  title: string;
  order_no: number;
  created_at: string;
  updated_at: string;
};

export async function GET() {
    try {
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
            `);

        if (error) {
            console.error('Supabase error fetching courses with lessons:', error.message);
            return Response.json(
                { error: error.message },
                { status: 400 }
            );
        }

        if (!data) {
            return Response.json([], { status: 200 });
        }

        const formattedData = data.map(course => {
            const actualLessons = Array.isArray(course.lessons) ? course.lessons : [];
            const lessonsCount = actualLessons.length;
            
            const { cover_image_url, lessons, ...restOfCourse } = course;

            return {
                ...restOfCourse,
                image_url: cover_image_url,
                lessons_count: lessonsCount,
                lessons: actualLessons, // Include the array of lesson objects
            };
        });

        return Response.json(formattedData, { status: 200 });

    } catch (e) {
        console.error('Server error in GET /api/courses-list:', (e as Error).message);
        return Response.json(
            { error: (e as Error).message || 'Unknown error' },
            { status: 500 }
        );
    }
}