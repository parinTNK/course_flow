import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try{
        const { data, error } = await supabase.from('profiles').select('*');

    }catch(e){
        return Response.json(
            { error: (e as Error).message || 'Unknown error' },
            { status: 404 }
          );

    }
}