'use client'

import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Upload, X, Play } from 'lucide-react'
import { createUploadUrl, deleteCourseVideo, getAssetStatus } from '@/app/actions/mux-actions'
import MuxPlayer from '@mux/mux-player-react'
import ConfirmationModal from './ConfirmationModal'


interface VideoUploadProps {
  courseId?: string
  existingAssetId?: string | null
  existingPlaybackId?: string | null
  onVideoUpdate?: (assetId: string, playbackId: string) => void
  onVideoDelete?: (assetId?: string | null) => void
  isMarkedForDeletion?: boolean
  onUploadStateChange?: (uploadState: {
    isUploading: boolean
    progress: number
    error: string | null
    success: boolean
    currentAssetId?: string | null
  }) => void
}

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
  const [currentAssetId, setCurrentAssetId] = useState<string | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [showRemoveVideoModal, setShowRemoveVideoModal] = useState(false)
  
  const xhrRef = React.useRef<XMLHttpRequest | null>(null)
  const pollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    if (onUploadStateChange) {
      onUploadStateChange({
        ...uploadState,
        currentAssetId: currentAssetId
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadState, currentAssetId])

  const cancelUpload = React.useCallback(async () => {
    console.log('🔴 Cancelling video upload...')
    
    if (xhrRef.current) {
      xhrRef.current.abort()
      xhrRef.current = null
    }
    
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
    
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

  const handleDeleteUploadClick = () => {
    setShowDeleteConfirmModal(true)
  }

  const handleConfirmDeleteUpload = async () => {
    setShowDeleteConfirmModal(false)
    await cancelUpload()
  }

  const handleCancelDeleteUpload = () => {
    setShowDeleteConfirmModal(false)
  }

  const handleRemoveVideoClick = () => {
    setShowRemoveVideoModal(true)
  }

  const handleConfirmRemoveVideo = async () => {
    setShowRemoveVideoModal(false)
    await handleDeleteVideo()
  }

  const handleCancelRemoveVideo = () => {
    setShowRemoveVideoModal(false)
  }

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

    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      setUploadState(prev => ({
        ...prev,
        error: 'File size exceeds 100MB limit',
      }))
      return
    }

    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      success: false,
    })
    
    setTempAssetId(null)
    setCurrentAssetId(null)

    try {
      const uploadResult = await createUploadUrl()
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error)
      }

      const uploadUrl = uploadResult.data.upload_url
      const uploadId = uploadResult.data.upload_id
      setTempAssetId(uploadId)

      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr

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
        xhrRef.current = null
        if (xhr.status === 200 || xhr.status === 201) {
          const pollForAsset = async () => {
            try {
              const statusResult = await getAssetStatus(uploadId)
              
              if (statusResult.success && statusResult.status === 'ready') {
                const { assetId, playbackId } = statusResult
                
                setCurrentAssetId(assetId)
                console.log('Video upload successful - stored currentAssetId:', assetId)
                
                onVideoUpdate?.(assetId, playbackId)
                setUploadState(prev => ({
                  ...prev,
                  success: true,
                  isUploading: false,
                }))
              } else if (statusResult.status === 'error') {
                throw new Error(statusResult.error || 'Video processing failed')
              } else {
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
          
          pollTimeoutRef.current = setTimeout(pollForAsset, 2000)
        } else {
          throw new Error('Upload failed')
        }
      })

      xhr.addEventListener('error', () => {
        xhrRef.current = null
        setUploadState(prev => ({
          ...prev,
          error: 'Upload failed',
          isUploading: false,
        }))
      })

      xhr.addEventListener('abort', () => {
        xhrRef.current = null
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
    
    const assetToDelete = existingAssetId || currentAssetId
    
    // Delete from Mux first if there's an asset
    if (assetToDelete) {
      try {
        console.log('🗑️ Deleting video asset from Mux:', assetToDelete)
        const deleteResponse = await fetch(`/api/mux-delete-asset?assetId=${assetToDelete}`, {
          method: 'DELETE',
        })
        
        if (deleteResponse.ok) {
          const result = await deleteResponse.json()
          console.log('✅ Video deleted from Mux:', result.message)
        } else {
          const errorResult = await deleteResponse.json()
          console.warn('⚠️ Mux delete failed:', errorResult)
        }
      } catch (error) {
        console.warn('Failed to delete video from Mux:', error)
      }
    }

    if (courseId) {
      onVideoDelete?.(existingAssetId || currentAssetId)
    } else {
      if (!existingAssetId && !currentAssetId && !tempAssetId && !uploadState.success) {
        console.log('No video to delete, returning early');
        return
      }

      try {
        onVideoDelete?.(currentAssetId)
        
        setUploadState(prev => ({
          ...prev,
          success: false,
          error: null,
        }))
        setTempAssetId(null)
        setCurrentAssetId(null)
        
      } catch (error) {
        setUploadState(prev => ({
          ...prev,
          error: 'Failed to delete video',
        }))
      }
    }
  }

  const hasExistingVideo = (existingAssetId && existingPlaybackId) || uploadState.success
  const showVideoPreview = hasExistingVideo && !isMarkedForDeletion && !uploadState.isUploading

  return (
    <div className="space-y-2">
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
            <div className="w-full h-full rounded-lg overflow-hidden pt-6 relative flex flex-col">
              <div 
                className="w-full aspect-video bg-black rounded-lg relative cursor-pointer group overflow-hidden"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowVideoModal(true);
                }}
              >
                {existingPlaybackId && (
                  <img
                    src={`https://image.mux.com/${existingPlaybackId}/thumbnail.png?width=320&height=180&fit_mode=pad&time=0`}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                )}
                
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <Play className="h-6 w-6 text-gray-800 ml-0.5" />
                  </div>
                </div>
              </div>
              
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
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemoveVideoClick();
              }}
              className="absolute top-8 right-2 w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 z-10"
              title={courseId ? 'Remove video' : 'Delete video'}
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : isMarkedForDeletion ? (
          <>
            <div className="flex flex-col items-center justify-center text-red-500 space-y-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Video Marked for Removal</p>
              <p className="text-xs text-center text-red-400">Will be removed when you save</p>
            </div>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteVideo();
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 z-10"
              title="Restore video"
            >
              <Upload className="h-3 w-3" />
            </button>
          </>
        ) : uploadState.isUploading ? (
          <>
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
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteUploadClick();
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 z-10"
              title="Cancel upload"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <>
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

      <input
        id="video-file-input"
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {uploadState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{uploadState.error}</p>
        </div>
      )}

      {uploadState.success && !showVideoPreview && !isMarkedForDeletion && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-600 text-sm">Video uploaded successfully! Processing may take a few minutes.</p>
        </div>
      )}

      {showVideoModal && showVideoPreview && (
        <div 
          className="fixed inset-0 bg-gray-900/25 flex items-center justify-center z-50"
          onClick={() => setShowVideoModal(false)}
        >
          <div 
            className="relative w-full max-w-4xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            
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

      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={handleCancelDeleteUpload}
        onConfirm={handleConfirmDeleteUpload}
        title="Cancel Video Upload"
        message="Are you sure you want to cancel this video upload? The video will be permanently deleted from Mux."
        confirmText="Yes, Cancel Upload"
        cancelText="No, Continue Upload"
        confirmButtonClass="bg-white border border-orange-500 text-orange-500 hover:bg-orange-50"
        cancelButtonClass="bg-blue-600 text-white hover:bg-blue-700"
      />

      <ConfirmationModal
        isOpen={showRemoveVideoModal}
        onClose={handleCancelRemoveVideo}
        onConfirm={handleConfirmRemoveVideo}
        title="Remove Video"
        message="Are you sure you want to remove this video?"
        confirmText="Yes, Remove Video"
        cancelText="No, Keep Video"
        confirmButtonClass="bg-white border border-orange-500 text-orange-500 hover:bg-orange-50"
        cancelButtonClass="bg-blue-600 text-white hover:bg-blue-700"
      />
    </div>
  )
})

VideoUpload.displayName = 'VideoUpload'

export default VideoUpload
