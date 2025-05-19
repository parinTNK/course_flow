import {supabase} from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';
import { getBangkokISOString } from '@/lib/bangkokTime';

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const courseId = params.id;
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

        if (!name && !price && !detail) {
            return Response.json({ error: 'At least one field must be provided for update' }, { status: 400 });
        }

        const updateData: Record<string, any> = {};
        
        if (name !== undefined) updateData.name = name;
        if (price !== undefined) updateData.price = price;
        if (total_learning_time !== undefined) updateData.total_learning_time = total_learning_time;
        if (summary !== undefined) updateData.summary = summary;
        if (detail !== undefined) updateData.detail = detail;
        if (promo_code_id !== undefined) updateData.promo_code_id = promo_code_id;
        if (cover_image_url !== undefined) updateData.cover_image_url = cover_image_url;
        if (video_trailer_url !== undefined) updateData.video_trailer_url = video_trailer_url;
        if (attachment_url !== undefined) updateData.attachment_url = attachment_url;
        if (status !== undefined) updateData.status = status;
        
        const bangkok = getBangkokISOString();
        updateData.updated_at = bangkok;

        const { data, error } = await supabase
            .from('courses')
            .update(updateData)
            .eq('id', courseId)
            .select();

        if (error) {
            return Response.json({ error: error.message }, { status: 500 });
        }

        if (data.length === 0) {
            return Response.json({ error: 'Course not found' }, { status: 404 });
        }

        return Response.json({ 
            message: 'Course updated successfully', 
            data 
        }, { status: 200 });
    } catch (err) {
        return Response.json({ 
            error: (err as Error).message || 'Internal Server Error' 
        }, { status: 500 });
    }
}