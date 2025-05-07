import {supabase} from '@/lib/supabaseClient';

export async function GET() {
    try {
        const { data, error } = await supabase.from('courses').select('*');
        if (error) {
            return Response.json(
                { error: error.message },
                { status: 400 }
            );
        }
        return Response.json(data, { status: 200 });
    } catch (e) {
        return Response.json(
            { error: (e as Error).message || 'Unknown error' },
            { status: 500 }
        );
    }
}