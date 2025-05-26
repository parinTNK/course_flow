'use client'

import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Upload, X, Play } from 'lucide-react'
import { createUploadUrl, deleteCourseVideo, getAssetStatus } from '@/app/actions/mux-actions'
import MuxPlayer from '@mux/mux-player-react'


interface VideoUploadProps {
  courseId?: string
  existingAssetId?: string | null
  existingPlaybackId?: string | null
  onVideoUpdate?: (assetId: string, playbackId: string) => void
  onVideoDelete?: (assetId?: string | null) => void
  // Add prop to track if video is marked for deletion in edit mode
  isMarkedForDeletion?: boolean
  // Add callback to expose upload state to parent
  onUploadStateChange?: (uploadState: {
    isUploading: boolean
    progress: number
    error: string | null
    success: boolean
    currentAssetId?: string | null // Expose current asset ID for cancellation
  }) => void
}

// Define methods that can be called on VideoUpload ref
export interface VideoUploadRef {
  cancelUpload: () => Promise<void>
}

const VideoUpload = forwardRef<VideoUploadRef, VideoUploadProps>(({
  courseId,
  existingAssetId,
  existingPlaybackId,
  onVideoUpdate,
  onVideoDelete,
  isMarkedForDeletion = false,
  onUploadStateChange,
}, ref) => {
  const [uploadState, setUploadState] = useState<{
    isUploading: boolean
    progress: number
    error: string | null
    success: boolean
  }>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
  })

  const [dragActive, setDragActive] = useState(false)
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const [tempAssetId, setTempAssetId] = useState<string | null>(null)
  const [currentAssetId, setCurrentAssetId] = useState<string | null>(null) // Store the actual asset ID
  const [showVideoModal, setShowVideoModal] = useState(false) // For video preview modal
  
  // Add ref to store XMLHttpRequest for cancellation
  const xhrRef = React.useRef<XMLHttpRequest | null>(null)
  const pollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Notify parent when upload state changes
  React.useEffect(() => {
    if (onUploadStateChange) {
      onUploadStateChange({
        ...uploadState,
        currentAssetId: currentAssetId
      })
    }
  // We intentionally exclude onUploadStateChange from dependencies to prevent infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadState, currentAssetId])

  // Cancel upload function
  const cancelUpload = React.useCallback(async () => {
    console.log('🔴 Cancelling video upload...')
    
    // Cancel XMLHttpRequest if it exists
    if (xhrRef.current) {
      xhrRef.current.abort()
      xhrRef.current = null
    }
    
    // Clear polling timeout
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
    
    // Delete assets from Mux - handle both active uploads and completed uploads
    const assetToDelete = tempAssetId || currentAssetId
    
    if (assetToDelete) {
      try {
        console.log('🗑️ Deleting cancelled upload asset:', assetToDelete, '(type:', tempAssetId ? 'active upload' : 'completed upload', ')')
        const deleteResponse = await fetch(`/api/mux-delete-asset?assetId=${assetToDelete}`, {
          method: 'DELETE',
        })
        
        if (deleteResponse.ok) {
          const result = await deleteResponse.json()
          console.log('✅ Delete response:', result.message)
        } else {
          const errorResult = await deleteResponse.json()
          console.warn('⚠️ Delete failed:', errorResult)
        }
      } catch (error) {
        console.warn('Failed to delete cancelled upload asset:', error)
      }
    } else {
      console.log('⚠️ No asset to delete during cancel')
    }
    
    // Reset state
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      success: false,
    })
    setTempAssetId(null)
    setCurrentAssetId(null)
    
    console.log('✅ Upload cancelled successfully')
  }, [tempAssetId, currentAssetId])

  // Expose cancel function to parent
  useImperativeHandle(ref, () => ({
    cancelUpload
  }), [cancelUpload])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }, [])

   
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a video file',
      }))
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      setUploadState(prev => ({
        ...prev,
        error: 'File size exceeds 10MB limit',
      }))
      return
    }

    // Reset states when starting new upload (important for replace video)
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      success: false,
    })
    
    // Clear previous asset IDs when replacing
    setTempAssetId(null)
    setCurrentAssetId(null)

    try {
      // Get upload URL from server
      const uploadResult = await createUploadUrl()
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error)
      }

      const uploadUrl = uploadResult.data.upload_url
      const uploadId = uploadResult.data.upload_id
      setTempAssetId(uploadId)

      // Upload file directly to Mux
      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr // Store reference for cancellation

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadState(prev => ({
            ...prev,
            progress,
          }))
        }
      })

      xhr.addEventListener('load', async () => {
        xhrRef.current = null // Clear reference when done
        if (xhr.status === 200 || xhr.status === 201) {
          // Poll for asset status
          const pollForAsset = async () => {
            try {
              const statusResult = await getAssetStatus(uploadId)
              
              if (statusResult.success && statusResult.status === 'ready') {
                const { assetId, playbackId } = statusResult
                
                // Store the actual asset ID for potential deletion
                setCurrentAssetId(assetId)
                console.log('Video upload successful - stored currentAssetId:', assetId)
                
                // For new courses, don't update database yet - just store the data
                // The course will be created when user clicks Create/Draft
                onVideoUpdate?.(assetId, playbackId)
                setUploadState(prev => ({
                  ...prev,
                  success: true,
                  isUploading: false,
                }))
              } else if (statusResult.status === 'error') {
                throw new Error(statusResult.error || 'Video processing failed')
              } else {
                // Still processing, poll again
                pollTimeoutRef.current = setTimeout(pollForAsset, 3000)
              }
            } catch (error) {
              setUploadState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to process video',
                isUploading: false,
              }))
            }
          }
          
          // Start polling after a short delay
          pollTimeoutRef.current = setTimeout(pollForAsset, 2000)
        } else {
          throw new Error('Upload failed')
        }
      })

      xhr.addEventListener('error', () => {
        xhrRef.current = null // Clear reference on error
        setUploadState(prev => ({
          ...prev,
          error: 'Upload failed',
          isUploading: false,
        }))
      })

      xhr.addEventListener('abort', () => {
        xhrRef.current = null // Clear reference on abort
        console.log('Upload aborted by user')
      })

      xhr.open('PUT', uploadUrl)
      xhr.send(file)

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Upload failed',
        isUploading: false,
      }))
    }
  }

  const handleDeleteVideo = async () => {
    console.log('VideoUpload handleDeleteVideo called - existingAssetId:', existingAssetId, 'currentAssetId:', currentAssetId, 'tempAssetId:', tempAssetId, 'uploadState.success:', uploadState.success);
    
    // In edit mode, just call the parent's delete handler for soft delete logic
    // The parent (useCourseForm) will handle marking for deletion vs immediate deletion
    if (courseId) {
      // Edit mode - let parent handle soft delete logic
      onVideoDelete?.(existingAssetId || currentAssetId)
    } else {
      // Create mode - immediate deletion as before
      if (!existingAssetId && !currentAssetId && !tempAssetId && !uploadState.success) {
        console.log('No video to delete, returning early');
        return
      }

      try {
        // For new courses (no courseId), call the callback to update the form state and handle deletion
        // Pass the currentAssetId so the parent can use it for deletion
        onVideoDelete?.(currentAssetId)
        
        // Reset local state
        setUploadState(prev => ({
          ...prev,
          success: false,
          error: null,
        }))
        setTempAssetId(null)
        setCurrentAssetId(null) // Reset the current asset ID
        
      } catch (error) {
        setUploadState(prev => ({
          ...prev,
          error: 'Failed to delete video',
        }))
      }
    }
  }

  const hasExistingVideo = (existingAssetId && existingPlaybackId) || uploadState.success
  const showVideoPreview = hasExistingVideo && !isMarkedForDeletion && !uploadState.isUploading // Hide preview during upload

  return (
    <div className="space-y-2">
      {/* Video preview and upload area similar to cover image */}
      <div 
        className={`relative w-[240px] h-[240px] flex items-center justify-center cursor-pointer rounded-lg p-4 text-center transition-all duration-200 ${
          dragActive 
            ? 'bg-blue-50 border-2 border-blue-300 border-dashed' 
            : 'bg-[#F6F7FC] hover:bg-gray-50 border border-gray-200'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!showVideoPreview && !uploadState.isUploading) {
            document.getElementById('video-file-input')?.click();
          }
        }}
      >
        {showVideoPreview ? (
          <>
            {/* Video preview in square container */}
            <div className="w-full h-full rounded-lg overflow-hidden pt-6 relative flex flex-col">
              {/* Video thumbnail section (16:9 aspect ratio) */}
              <div 
                className="w-full aspect-video bg-black rounded-lg relative cursor-pointer group overflow-hidden"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowVideoModal(true);
                }}
              >
                {/* Actual video thumbnail */}
                {existingPlaybackId && (
                  <img
                    src={`https://image.mux.com/${existingPlaybackId}/thumbnail.png?width=320&height=180&fit_mode=pad&time=0`}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <Play className="h-6 w-6 text-gray-800 ml-0.5" />
                  </div>
                </div>
                
                {/* Video indicator */}
               
              </div>
              
              {/* Bottom section for replace button */}
              <div className="flex-1 flex items-center justify-center p-3 bg-gray-50">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    document.getElementById('video-file-input')?.click();
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg flex items-center gap-2 shadow-md transition-colors duration-200"
                  title="Replace video"
                >
                  <Upload className="h-4 w-4" />
                  Replace Video
                </button>
              </div>
            </div>
            
            {/* Delete button - X at top right corner */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteVideo();
              }}
              className="absolute top-8 right-2 w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 z-10"
              title={courseId ? 'Remove video' : 'Delete video'}
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : isMarkedForDeletion ? (
          <>
            {/* Marked for deletion state */}
            <div className="flex flex-col items-center justify-center text-red-500 space-y-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Video Marked for Removal</p>
              <p className="text-xs text-center text-red-400">Will be removed when you save</p>
            </div>
            
            {/* Restore button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteVideo(); // This will restore the video in edit mode
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 z-10"
              title="Restore video"
            >
              <Upload className="h-3 w-3" />
            </button>
          </>
        ) : uploadState.isUploading ? (
          <>
            {/* Upload progress state */}
            <div className="flex flex-col items-center justify-center space-y-3 w-full">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-blue-500 animate-pulse" />
              </div>
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Uploading...</span>
                  <span className="text-blue-600 font-medium">{uploadState.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Cancel button during upload */}
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // console.log('🚫 VideoUpload: Inline cancel clicked');
                // console.log('🚫 VideoUpload: Current state - tempAssetId:', tempAssetId, 'currentAssetId:', currentAssetId);
                
                // Cancel XMLHttpRequest if active
                if (xhrRef.current) {
                  // console.log('🚫 VideoUpload: Aborting XMLHttpRequest');
                  xhrRef.current.abort();
                  xhrRef.current = null;
                }

                // Clear polling timeout
                if (pollTimeoutRef.current) {
                  // console.log('🚫 VideoUpload: Clearing polling timeout');
                  clearTimeout(pollTimeoutRef.current);
                  pollTimeoutRef.current = null;
                }

                // Delete assets from Mux - handle both active uploads and completed uploads
                const assetToDelete = tempAssetId || currentAssetId;
                
                if (assetToDelete) {
                  // console.log('🚫 VideoUpload: Deleting asset:', assetToDelete, '(type:', tempAssetId ? 'active upload' : 'completed upload', ')');
                  try {
                    const deleteResponse = await fetch(`/api/mux-delete-asset?assetId=${assetToDelete}`, {
                      method: 'DELETE',
                    });
                    
                    if (deleteResponse.ok) {
                      const result = await deleteResponse.json();
                      console.log('✅ VideoUpload: Delete response:', result.message);
                    } else {
                      const errorResult = await deleteResponse.json();
                      console.warn('⚠️ VideoUpload: Delete failed:', errorResult);
                    }
                  } catch (error) {
                    console.error('❌ VideoUpload: Failed to delete asset:', error);
                  }
                } else {
                  console.log('⚠️ VideoUpload: No asset to delete during cancel');
                }

                // Reset state
                setUploadState({
                  isUploading: false,
                  progress: 0,
                  error: null,
                  success: false,
                });
                setTempAssetId(null);
                setCurrentAssetId(null);
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 z-10"
              title="Cancel upload"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <>
            {/* Upload prompt state */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Play className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-blue-500">Upload Video</p>
              <p className="text-xs text-gray-500 text-center">Click or drag video here</p>
            </div>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        id="video-file-input"
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Error message */}
      {uploadState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{uploadState.error}</p>
        </div>
      )}

      {/* Success message for completed uploads */}
      {uploadState.success && !showVideoPreview && !isMarkedForDeletion && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-600 text-sm">Video uploaded successfully! Processing may take a few minutes.</p>
        </div>
      )}

      {/* Helper text
      <div className="text-xs text-gray-500 space-y-1">
        <p>Supported formats: MP4, MOV, AVI, MKV</p>
        <p>Maximum file size: 5GB • Recommended: 1080p, H.264 codec</p>
      </div> */}

      {/* Video Modal */}
      {showVideoModal && showVideoPreview && (
        <div 
          className="fixed inset-0 bg-gray-900/25 flex items-center justify-center z-50"
          onClick={() => setShowVideoModal(false)}
        >
          <div 
            className="relative w-full max-w-4xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            
            {/* Video player */}
            <div className="bg-black rounded-lg overflow-hidden">
              {existingPlaybackId && (
                <MuxPlayer
                  playbackId={existingPlaybackId}
                  accent-color="#3B82F6"
                  className="w-full"
                  style={{ aspectRatio: '16/9' }}
                  autoPlay
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

VideoUpload.displayName = 'VideoUpload'

export default VideoUpload
