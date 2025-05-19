import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs';

// TODO: When uploading a new file for the same post, delete the old file first.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log('[upload-cover] route handler start');
export async function POST(req: NextRequest) {
  console.log('[upload-cover] request method:', req.method);
  try {
    const formData = await req.formData();
    console.log('[upload-cover] formData entries:', Array.from(formData.entries()));
    const file = formData.get('coverImage');
    console.log('[upload-cover] file object:', file);

    if (!file) {
      console.error('[upload-cover] No file found');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file instanceof File && file.size > 5 * 1024 * 1024) {
      console.error('[upload-cover] File too large:', file.size);
      return NextResponse.json({ error: 'Cover image must be less than 5MB' }, { status: 400 });
    }

    const ext = (file instanceof File ? file.name : 'file').split('.').pop() || ''
    const fileName = `course-cover-${Date.now()}.${ext}`

    const arrayBuffer = await (file as File).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { data, error } = await supabaseAdmin
      .storage
      .from('courses-cover-image')
      .upload(fileName, buffer, {
        contentType: (file as File).type,
        upsert: false
      })

    if (error) {
      console.error('Supabase storage.upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const {
      data: { publicUrl }
    } = supabaseAdmin
      .storage
      .from('courses-cover-image')
      .getPublicUrl(fileName)
    return NextResponse.json({ url: publicUrl }, { status: 200 })
  } catch (err) {
    console.error('[upload-cover] caught exception:', err);
    return NextResponse.json({ error: (err as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}
