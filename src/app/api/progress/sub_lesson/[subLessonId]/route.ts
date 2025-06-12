import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subLessonId: string }> }
) {
  try {
    const supabase_client = createServerComponentClient({ cookies })
    const { data: { user } } = await supabase_client.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subLessonId } = await params

    const { data: progress, error } = await supabase_client
      .from('sub_lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('sub_lesson_id', subLessonId)
      .single()

    const { data: subLesson, error: subLessonError } = await supabase_client
      .from('sub_lessons')
      .select('duration')
      .eq('id', subLessonId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching progress:', error)
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    if (!progress) {
      return NextResponse.json({
        watch_time: 0,
        status: 'not_started',
        duration: subLesson?.duration || null
      })
    }

    return NextResponse.json({
      watch_time: progress.watch_time || 0,
      status: progress.status,
      duration: progress.duration || subLesson?.duration || null
    })

  } catch (error) {
    console.error('Error in GET /api/progress/sub_lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subLessonId: string }> }
) {
  try {
    const supabase_client = createServerComponentClient({ cookies })
    const { data: { user } } = await supabase_client.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subLessonId } = await params
    const body = await request.json()
    const { watch_time, status, duration } = body

    if (typeof watch_time !== 'number' || watch_time < 0) {
      return NextResponse.json({ error: 'Invalid watch_time' }, { status: 400 })
    }

    if (status && !['not_started', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data: currentProgress } = await supabase_client
      .from('sub_lesson_progress')
      .select('status')
      .eq('user_id', user.id)
      .eq('sub_lesson_id', subLessonId)
      .single()

    let finalStatus = status
    
    if (currentProgress?.status === 'completed' && !status) {
      finalStatus = 'completed'
    } else if (!finalStatus && duration) {
      if (watch_time === 0) {
        finalStatus = 'not_started'
      } else if (watch_time >= duration * 0.95) {
        finalStatus = 'completed'
      } else {
        finalStatus = 'in_progress'
      }
    } else if (!finalStatus) {
      finalStatus = watch_time > 0 ? 'in_progress' : 'not_started'
    }

    const progressData: any = {
      user_id: user.id,
      sub_lesson_id: subLessonId,
      watch_time,
      status: finalStatus,
      video_watched_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (duration) {
      progressData.duration = duration
    }

    const { data, error } = await supabase_client
      .from('sub_lesson_progress')
      .upsert(progressData, {
        onConflict: 'user_id,sub_lesson_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating progress:', error)
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        watch_time: data.watch_time,
        status: data.status,
        duration: data.duration
      }
    })

  } catch (error) {
    console.error('Error in POST /api/progress/sub_lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
