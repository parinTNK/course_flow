import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
export const runtime = 'nodejs';

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
            status,
            created_at,
            updated_at
        } = body;

        if (!name) {
            return NextResponse.json({ error: 'Course name is required' }, { status: 400 });
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
                status: status || 'draft',
                created_at: created_at || new Date().toISOString(),
                updated_at: updated_at || new Date().toISOString()
            }])
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ 
            message: 'Course added successfully', 
            data 
        }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ 
            error: (err as Error).message || 'Internal Server Error' 
        }, { status: 500 });
    }
}