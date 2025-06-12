'use client'

import React, { useState, useCallback, forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { Upload, X, Play } from 'lucide-react'
import { createUploadUrl, getAssetStatus } from '@/app/actions/mux-actions'
import MuxPlayer from '@mux/mux-player-react'

interface SubLessonVideoUploadProps {
  subLessonId: string | number
  existingAssetId?: string | null
  existingPlaybackId?: string | null
  onVideoUpdate?: (subLessonId: string | number, assetId: string, playbackId: string) => void
  onVideoDelete?: (subLessonId: string | number) => void
  disabled?: boolean
  isMarkedForDeletion?: boolean
  onUploadStateChange?: (subLessonId: string | number, uploadState: {
    isUploading: boolean
    progress: number
    error: string | null
    success: boolean
    currentAssetId?: string | null
  }) => void
}

export interface SubLessonVideoUploadRef {
  cancelUpload: () => Promise<void>
}

const SubLessonVideoUpload = forwardRef<SubLessonVideoUploadRef, SubLessonVideoUploadProps>(({
  subLessonId,
  existingAssetId,
  existingPlaybackId,
  onVideoUpdate,
  onVideoDelete,
  disabled = false,
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
  const [tempAssetId, setTempAssetId] = useState<string | null>(null)
  const [currentAssetId, setCurrentAssetId] = useState<string | null>(null)
  const [currentPlaybackId, setCurrentPlaybackId] = useState<string | null>(existingPlaybackId)
  const [showVideoModal, setShowVideoModal] = useState(false)

  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (onUploadStateChange) {
      onUploadStateChange(subLessonId, {
        ...uploadState,
        currentAssetId
      })
    }
  }, [uploadState, subLessonId, currentAssetId])

  useImperativeHandle(ref, () => ({
    cancelUpload: async () => {
      if (xhrRef.current) {
        xhrRef.current.abort()
        xhrRef.current = null
      }
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current)
        pollingTimeoutRef.current = null
      }
      const assetToDelete = tempAssetId || currentAssetId
      if (assetToDelete) {
        try {
          const deleteResponse = await fetch(`/api/mux-delete-asset?assetId=${assetToDelete}`, {
            method: 'DELETE',
          })
          if (deleteResponse.ok) {
            await deleteResponse.json()
          } else {
            await deleteResponse.json()
          }
        } catch (error) {}
      }
      setUploadState({
        isUploading: false,
        progress: 0,
        error: null,
        success: false,
      })
      setCurrentAssetId(null)
      setTempAssetId(null)
    }
  }), [subLessonId, tempAssetId, currentAssetId])

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
    if (e.dataTransfer.files && e.dataTransfer.files[0] && !disabled) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }, [disabled])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && !disabled) {
      handleFileUpload(e.target.files[0])
    }
  }, [disabled])

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
      xhr.addEventListener('abort', () => {
        setUploadState({
          isUploading: false,
          progress: 0,
          error: 'Upload cancelled',
          success: false,
        })
        xhrRef.current = null
      })
      xhr.addEventListener('load', async () => {
        if (xhr.status === 200 || xhr.status === 201) {
          xhrRef.current = null
          const pollForAsset = async () => {
            try {
              const statusResult = await getAssetStatus(uploadId)
              if (statusResult.success && statusResult.status === 'ready') {
                const { assetId, playbackId } = statusResult
                setCurrentAssetId(assetId)
                setCurrentPlaybackId(playbackId)
                onVideoUpdate?.(subLessonId, assetId, playbackId)
                setUploadState(prev => ({
                  ...prev,
                  success: true,
                  isUploading: false,
                }))
                pollingTimeoutRef.current = null
              } else if (statusResult.status === 'error') {
                pollingTimeoutRef.current = null
                throw new Error(statusResult.error || 'Video processing failed')
              } else {
                pollingTimeoutRef.current = setTimeout(pollForAsset, 3000)
              }
            } catch (error) {
              pollingTimeoutRef.current = null
              setUploadState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to process video',
                isUploading: false,
              }))
            }
          }
          pollingTimeoutRef.current = setTimeout(pollForAsset, 2000)
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
    try {
      onVideoDelete?.(subLessonId)
      if (!isMarkedForDeletion) {
        setUploadState(prev => ({
          ...prev,
          success: false,
          error: null,
        }))
        setTempAssetId(null)
        setCurrentAssetId(null)
        setCurrentPlaybackId(null)
      }
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        error: 'Failed to delete video',
      }))
    }
  }

  const displayPlaybackId = currentPlaybackId || existingPlaybackId
  const hasExistingVideo = (existingAssetId && existingPlaybackId) || uploadState.success
  const showVideoPreview = hasExistingVideo && !isMarkedForDeletion && !uploadState.isUploading

  return (
    <div className="space-y-2">
      <div 
        className={`relative w-[240px] h-[240px] flex items-center justify-center cursor-pointer rounded-lg p-4 text-center transition-all duration-200 ${
          disabled 
            ? 'bg-gray-100 cursor-not-allowed' 
            : dragActive 
              ? 'bg-blue-50 border-2 border-blue-300 border-dashed' 
              : 'bg-[#F6F7FC] hover:bg-gray-50 border border-gray-200'
        }`}
        onDragEnter={!disabled ? handleDrag : undefined}
        onDragLeave={!disabled ? handleDrag : undefined}
        onDragOver={!disabled ? handleDrag : undefined}
        onDrop={!disabled ? handleDrop : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!showVideoPreview && !uploadState.isUploading && !disabled) {
            document.getElementById(`video-file-input-${subLessonId}`)?.click();
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
                  if (!disabled) {
                    setShowVideoModal(true);
                  }
                }}
              >
                {displayPlaybackId && (
                  <img
                    src={`https://image.mux.com/${displayPlaybackId}/thumbnail.png?width=320&height=180&fit_mode=pad&time=0`}
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
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      document.getElementById(`video-file-input-${subLessonId}`)?.click();
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg flex items-center gap-2 shadow-md transition-colors duration-200"
                    title="Replace video"
                  >
                    <Upload className="h-4 w-4" />
                    Replace Video
                  </button>
                )}
              </div>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteVideo();
                }}
                className="absolute top-8 right-2 w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 z-10"
                title="Remove video"
              >
                <X className="h-3 w-3" />
              </button>
            )}
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
            {!disabled && (
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
            )}
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
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (xhrRef.current) {
                  xhrRef.current.abort();
                  xhrRef.current = null;
                }
                if (pollingTimeoutRef.current) {
                  clearTimeout(pollingTimeoutRef.current);
                  pollingTimeoutRef.current = null;
                }
                const assetToDelete = tempAssetId || currentAssetId;
                if (assetToDelete) {
                  try {
                    const deleteResponse = await fetch(`/api/mux-delete-asset?assetId=${assetToDelete}`, {
                      method: 'DELETE',
                    });
                    if (deleteResponse.ok) {
                    } else {
                      await deleteResponse.json();
                    }
                  } catch (error) {}
                }
                setUploadState({
                  isUploading: false,
                  progress: 0,
                  error: null,
                  success: false,
                });
                setCurrentAssetId(null);
                setTempAssetId(null);
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
        id={`video-file-input-${subLessonId}`}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
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
      {showVideoModal && displayPlaybackId && (
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
              <MuxPlayer
                playbackId={displayPlaybackId}
                accent-color="#3B82F6"
                className="w-full"
                style={{ aspectRatio: '16/9' }}
                autoPlay
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

SubLessonVideoUpload.displayName = 'SubLessonVideoUpload'

export default SubLessonVideoUpload
