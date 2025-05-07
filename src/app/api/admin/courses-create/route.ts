import {supabase} from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            name, 
            price, 
            total_learning_time, 
            summary, 
            detail, 
            promo_code_id,
            cover_image_url,
            video_trailer_url,
            attachment_url,
            status
        } = body;

        // TODO: check Validate the input data or refactor to a function or middleware
        if (!name || !price || !detail) {
            return Response.json({ error: 'Course name is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('courses')
            .insert([{ 
                name, 
                price, 
                total_learning_time, 
                summary, 
                detail, 
                promo_code_id,
                cover_image_url,
                video_trailer_url,
                attachment_url,
                status: status || 'draft'
            }])
            .select();

        if (error) {
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({ 
            message: 'Course added successfully', 
            data 
        }, { status: 201 });
    } catch (err) {
        return Response.json({ 
            error: (err as Error).message || 'Internal Server Error' 
        }, { status: 500 });
    }
}