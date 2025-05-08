import {supabase} from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const courseId = params.id;

        const { data: existingCourse, error: fetchError } = await supabase
            .from('courses')
            .select('id')
            .eq('id', courseId)
            .single();

        if (fetchError || !existingCourse) {
            return Response.json({ error: 'Course not found' }, { status: 404 });
        }

        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', courseId);

        if (error) {
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({ 
            message: 'Course deleted successfully' 
        }, { status: 200 });
    } catch (err) {
        return Response.json({ 
            error: (err as Error).message || 'Internal Server Error' 
        }, { status: 500 });
    }
}