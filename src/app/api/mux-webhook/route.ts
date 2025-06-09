import { NextRequest, NextResponse } from 'next/server'
import { mux } from '@/lib/mux'
import { supabase } from '@/lib/supabaseClient'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('mux-signature')
    
    if (!signature) {
      console.error('Missing Mux signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('Missing webhook secret')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    
    console.log('Received Mux webhook:', event.type)

    switch (event.type) {
      case 'video.asset.ready':
        await handleAssetReady(event)
        break
      case 'video.asset.errored':
        await handleAssetErrored(event)
        break
      case 'video.upload.asset_created':
        await handleUploadAssetCreated(event)
        break
      default:
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleAssetReady(event: any) {
  try {
    const assetId = event.data.id
    const playbackIds = event.data.playback_ids
    const duration = event.data.duration // Duration in seconds
    
    if (!playbackIds || playbackIds.length === 0) {
      console.error('No playback IDs found for asset:', assetId)
      return
    }

    const publicPlaybackId = playbackIds.find((pb: any) => pb.policy === 'public')?.id
    
    if (!publicPlaybackId) {
      console.error('No public playback ID found for asset:', assetId)
      return
    }

    const supabase_client = supabase
    
    // Check if this is a course trailer or sub-lesson video
    // First try to update course trailer
    const { data: courseData, error: courseError } = await supabase_client
      .from('courses')
      .update({
        video_trailer_url: publicPlaybackId,
        updated_at: new Date().toISOString(),
      })
      .eq('video_trailer_mux_asset_id', assetId)
      .select()

    if (courseError) {
      console.error('Failed to update course with playback ID:', courseError)
    } else if (courseData && courseData.length > 0) {
      console.log('Successfully updated course with playback ID:', publicPlaybackId)
      return
    }

    // If no course updated, try to update sub-lesson
    const { data: subLessonData, error: subLessonError } = await supabase_client
      .from('sub_lessons')
      .update({
        is_ready: true,
        duration: duration,
        updated_at: new Date().toISOString(),
      })
      .eq('mux_asset_id', assetId)
      .select()

    if (subLessonError) {
      console.error('Failed to update sub-lesson with duration:', subLessonError)
    } else if (subLessonData && subLessonData.length > 0) {
      console.log('Successfully updated sub-lesson with duration:', duration, 'seconds')
    } else {
      console.log('No matching course or sub-lesson found for asset:', assetId)
    }
  } catch (error) {
    console.error('Error handling asset ready:', error)
  }
}

async function handleAssetErrored(event: any) {
  try {
    const assetId = event.data.id
    const errors = event.data.errors
    
    console.error('Asset processing failed:', assetId, errors)
    
    const supabase_client = supabase
    
    // You might want to add an error status field to your courses table
    // For now, we'll just log the error
    const { error } = await supabase_client
      .from('courses')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('video_trailer_mux_asset_id', assetId)

    if (error) {
      console.error('Failed to update course after asset error:', error)
    }
  } catch (error) {
    console.error('Error handling asset error:', error)
  }
}

async function handleUploadAssetCreated(event: any) {
  try {
    const uploadId = event.data.upload_id
    const assetId = event.data.asset_id
    
    console.log('Upload asset created:', { uploadId, assetId })
    
    // The asset is created but might not be ready yet
    // We'll wait for the asset.ready event to update the playback ID
  } catch (error) {
    console.error('Error handling upload asset created:', error)
  }
}
