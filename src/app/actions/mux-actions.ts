'use server'

import { mux } from '@/lib/mux'
import { supabase } from '@/lib/supabaseClient'
import { revalidatePath } from 'next/cache'

export async function createUploadUrl() {
  try {
    const upload = await mux.video.uploads.create({
      cors_origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      new_asset_settings: {
        playback_policy: ['public'],
        encoding_tier: 'baseline',
      },
    })

    return {
      success: true,
      data: {
        upload_id: upload.id,
        upload_url: upload.url,
      },
    }
  } catch (error) {
    console.error('Error creating upload URL:', error)
    return {
      success: false,
      error: 'Failed to create upload URL',
    }
  }
}

export async function updateCourseVideo(
  courseId: string, 
  assetId: string, 
  playbackId: string
) {
  try {
    // Get current course data
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('video_trailer_mux_asset_id')
      .eq('id', courseId)
      .single()

    if (fetchError) {
      throw new Error('Failed to fetch course')
    }

    // Delete old asset if exists
    if (course?.video_trailer_mux_asset_id) {
      try {
        await mux.video.assets.delete(course.video_trailer_mux_asset_id)
      } catch (deleteError) {
        console.warn('Failed to delete old asset:', deleteError)
        // Continue with update even if deletion fails
      }
    }

    // Update course with new video data
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        video_trailer_mux_asset_id: assetId,
        video_trailer_url: playbackId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)

    if (updateError) {
      throw new Error('Failed to update course')
    }

    revalidatePath(`/admin/dashboard/courses/${courseId}`)
    revalidatePath('/admin/dashboard/courses')

    return {
      success: true,
      message: 'Video updated successfully',
    }
  } catch (error) {
    console.error('Error updating course video:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update video',
    }
  }
}

export async function deleteCourseVideo(courseId: string) {
  try {
    // Get current course data
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('video_trailer_mux_asset_id')
      .eq('id', courseId)
      .single()

    if (fetchError) {
      throw new Error('Failed to fetch course')
    }

    // Delete asset from Mux
    if (course?.video_trailer_mux_asset_id) {
      try {
        await mux.video.assets.delete(course.video_trailer_mux_asset_id)
      } catch (deleteError) {
        console.warn('Failed to delete asset from Mux:', deleteError)
      }
    }

    // Remove video data from course
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        video_trailer_mux_asset_id: null,
        video_trailer_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)

    if (updateError) {
      throw new Error('Failed to update course')
    }

    revalidatePath(`/admin/dashboard/courses/${courseId}`)
    revalidatePath('/admin/dashboard/courses')

    return {
      success: true,
      message: 'Video deleted successfully',
    }
  } catch (error) {
    console.error('Error deleting course video:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete video',
    }
  }
}

export async function getAssetStatus(uploadId: string) {
  try {
    // Get upload info to find the asset ID
    const upload = await mux.video.uploads.retrieve(uploadId)
    
    if (!upload.asset_id) {
      return {
        success: false,
        status: 'processing',
        message: 'Asset is still being created',
      }
    }

    // Get asset details
    const asset = await mux.video.assets.retrieve(upload.asset_id)
    
    if (asset.status === 'ready') {
      // Get playback ID
      const playbackIds = asset.playback_ids || []
      const publicPlaybackId = playbackIds.find(p => p.policy === 'public')
      
      if (publicPlaybackId) {
        return {
          success: true,
          status: 'ready',
          assetId: asset.id,
          playbackId: publicPlaybackId.id,
        }
      }
    }

    return {
      success: false,
      status: asset.status,
      message: `Asset status: ${asset.status}`,
    }
  } catch (error) {
    console.error('Error getting asset status:', error)
    return {
      success: false,
      status: 'error',
      error: 'Failed to get asset status',
    }
  }
}
