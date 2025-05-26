import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomToast } from '@/components/ui/CustomToast';
import { CourseFormData, Lesson } from '@/types/courseAdmin';
import { deleteCourseVideo } from '@/app/actions/mux-actions';

const INITIAL_FORM_DATA: CourseFormData = {
  name: '',
  price: '',
  total_learning_time: '',
  summary: '',
  detail: '',
  promo_code_id: null,
  status: 'draft',
  cover_image_url: null,
};

interface UseCourseFormProps {
  courseId?: string;
  initialData?: CourseFormData;
}

export const useCourseForm = (props?: UseCourseFormProps) => {
  const { courseId, initialData } = props || {};
  const isEditMode = !!courseId;
  
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useCustomToast();

  const [formData, _setFormData] = useState<CourseFormData>(initialData || INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [videoData, setVideoData] = useState<{assetId: string, playbackId: string} | null>(null);
  
  const [originalVideoData, setOriginalVideoData] = useState<{
    video_trailer_mux_asset_id: string | null;
    video_trailer_url: string | null;
  } | null>(null);
  
  const [newVideoData, setNewVideoData] = useState<{
    assetId: string;
    playbackId: string;
  } | null>(null);
  const [newVideosHistory, setNewVideosHistory] = useState<Array<{
    assetId: string;
    playbackId: string;
  }>>([]);
  const [videoMarkedForDeletion, setVideoMarkedForDeletion] = useState<string | null>(null);
  
  const coverRef = useRef<HTMLInputElement>(null);
  
  const originalVideoRef = useRef<{
    video_trailer_mux_asset_id: string | null;
    video_trailer_url: string | null;
  } | null>(null);

  const initialLoadDoneRef = useRef(false);

  const setFormData = useCallback((data: CourseFormData | ((prev: CourseFormData) => CourseFormData)) => {
    if (typeof data === 'function') {
      _setFormData(data);
    } else {
      _setFormData(data);
      if (isEditMode && !initialLoadDoneRef.current && (data.video_trailer_mux_asset_id || data.video_trailer_url)) {
        const originalVideo = {
          video_trailer_mux_asset_id: data.video_trailer_mux_asset_id || null,
          video_trailer_url: data.video_trailer_url || null,
        };
        originalVideoRef.current = originalVideo;
        initialLoadDoneRef.current = true;
        setOriginalVideoData(originalVideo);
      }
    }
  }, [isEditMode]);

  const setOriginalVideoDataStable = useCallback((data: {
    video_trailer_mux_asset_id: string | null;
    video_trailer_url: string | null;
  } | null) => {
    originalVideoRef.current = data;
    setOriginalVideoData(prev => {
      if (!prev && !data) return prev;
      if (!prev || !data) return data;
      if (prev.video_trailer_mux_asset_id === data.video_trailer_mux_asset_id && 
          prev.video_trailer_url === data.video_trailer_url) {
        return prev;
      }
      return data;
    });
  }, []);

  const deleteVideoFromMux = useCallback(async (assetId: string, context: string): Promise<boolean> => {
    try {
      const deleteResponse = await fetch(`/api/mux-delete-asset?assetId=${assetId}`, {
        method: 'DELETE',
      });
      if (!deleteResponse.ok) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      return false;
    }
  }, []);

  const cleanupVideos = useCallback(async (videos: Array<{assetId: string, playbackId: string}>, context: string) => {
    if (videos.length === 0) return;
    for (const video of videos) {
      await deleteVideoFromMux(video.assetId, context);
    }
  }, [deleteVideoFromMux]);

  const clearVideoFromForm = useCallback(() => {
    _setFormData(prev => ({
      ...prev,
      video_trailer_mux_asset_id: null,
      video_trailer_url: null,
    }));
  }, []);

  const updateVideoInForm = useCallback((assetId: string, playbackId: string) => {
    _setFormData(prev => ({
      ...prev,
      video_trailer_mux_asset_id: assetId,
      video_trailer_url: playbackId,
    }));
  }, []);

  const validateVideoStateConsistency = useCallback(() => {
    if (isEditMode) {
      if (newVideosHistory.length > 0) {
        const latestVideo = newVideosHistory[newVideosHistory.length - 1];
        if (!newVideoData || newVideoData.assetId !== latestVideo.assetId) {
          setNewVideoData(latestVideo);
        }
      }
    } else {
      if (newVideosHistory.length > 0) {
        const latestVideo = newVideosHistory[newVideosHistory.length - 1];
        if (!videoData || videoData.assetId !== latestVideo.assetId) {
          setVideoData(latestVideo);
          updateVideoInForm(latestVideo.assetId, latestVideo.playbackId);
        }
      }
    }
  }, [isEditMode, newVideosHistory, newVideoData, videoData, updateVideoInForm]);

  const handleEditModeVideoCleanupBeforeSave = useCallback(async () => {
    if (videoMarkedForDeletion) {
      await deleteVideoFromMux(videoMarkedForDeletion, 'marked for deletion before database update');
    }
    const originalVideoToCheck = originalVideoData || originalVideoRef.current;
    const hasNewVideo = formData.video_trailer_mux_asset_id && 
                       formData.video_trailer_mux_asset_id !== originalVideoToCheck?.video_trailer_mux_asset_id;
    if (hasNewVideo && originalVideoToCheck?.video_trailer_mux_asset_id) {
      await deleteVideoFromMux(originalVideoToCheck.video_trailer_mux_asset_id, 'original video being replaced');
    }
    if (newVideosHistory.length > 1) {
      const latestVideo = newVideosHistory[newVideosHistory.length - 1];
      const videosToDelete = newVideosHistory.slice(0, -1);
      await cleanupVideos(videosToDelete, 'old new videos before database update');
      setNewVideosHistory([latestVideo]);
      if (!newVideoData || newVideoData.assetId !== latestVideo.assetId) {
        setNewVideoData(latestVideo);
      }
    }
  }, [newVideoData, originalVideoData, videoMarkedForDeletion, newVideosHistory, formData.video_trailer_mux_asset_id, deleteVideoFromMux, cleanupVideos]);

  const handleCreateModeVideoCleanupBeforeSave = useCallback(async () => {
    if (newVideosHistory.length > 1) {
      const latestVideo = newVideosHistory[newVideosHistory.length - 1];
      const videosToDelete = newVideosHistory.slice(0, -1);
      await cleanupVideos(videosToDelete, 'old videos in create mode before database update');
      setNewVideosHistory([latestVideo]);
      if (!videoData || videoData.assetId !== latestVideo.assetId) {
        setVideoData(latestVideo);
        updateVideoInForm(latestVideo.assetId, latestVideo.playbackId);
      }
    } else if (newVideosHistory.length === 1) {
      const singleVideo = newVideosHistory[0];
      if (!videoData || videoData.assetId !== singleVideo.assetId) {
        setVideoData(singleVideo);
        updateVideoInForm(singleVideo.assetId, singleVideo.playbackId);
      }
    }
  }, [videoData, newVideosHistory, deleteVideoFromMux, cleanupVideos, updateVideoInForm]);

  useEffect(() => {
    if (!isEditMode) {
      const savedFormData = localStorage.getItem('courseFormData');
      if (savedFormData) {
        try {
          _setFormData(JSON.parse(savedFormData));
        } catch (error) {
        }
      }
    }
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      localStorage.setItem('courseFormData', JSON.stringify(formData));
    }
  }, [formData, isEditMode]);

  useEffect(() => {
    if (initialData?.cover_image_url) {
      setCoverPreview(initialData.cover_image_url);
    }
    if (isEditMode && initialData) {
      const originalVideo = {
        video_trailer_mux_asset_id: initialData.video_trailer_mux_asset_id || null,
        video_trailer_url: initialData.video_trailer_url || null,
      };
      setOriginalVideoData(originalVideo);
    }
  }, [initialData, isEditMode]);

  const handleCoverClick = () => coverRef.current?.click();

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 5 * 1024 * 1024) {
      toastError('Cover image must be less than 5 MB');
      return;
    }
    setCoverImageFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : '');
    if (errors.coverImage) setErrors((prev) => { const u = { ...prev }; delete u.coverImage; return u; });
  };

  const handleCoverRemove = () => {
    setCoverImageFile(null);
    setCoverPreview('');
    if (errors.coverImage) setErrors((prev) => { const u = { ...prev }; delete u.coverImage; return u; });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (errors[id]) {
      setErrors((prevErrors) => ({ ...prevErrors, [id]: '' }));
    }
    const keyMap: Record<string, keyof CourseFormData> = {
      'course-name': 'name',
      'price': 'price',
      'learning-time': 'total_learning_time',
      'course-summary': 'summary',
      'course-detail': 'detail',
    };
    const formKey = keyMap[id] || id as keyof CourseFormData;
    _setFormData((prevData) => ({ ...prevData, [formKey]: value }));
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors['course-name'] = 'Please fill out this field';
    const priceValue = typeof formData.price === 'string' ? formData.price.trim() : formData.price;
    if (!priceValue && priceValue !== 0) newErrors['price'] = 'Please fill out this field';
    else {
      const priceNum = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
      if (isNaN(priceNum) || priceNum < 0) newErrors['price'] = 'Please enter a valid price';
    }
    const timeValue = typeof formData.total_learning_time === 'string' ? 
      formData.total_learning_time.trim() : formData.total_learning_time;
    if (!timeValue && timeValue !== 0) newErrors['learning-time'] = 'Please fill out this field';
    else {
      const timeNum = typeof timeValue === 'string' ? parseInt(timeValue) : timeValue;
      if (isNaN(timeNum) || timeNum <= 0) newErrors['learning-time'] = 'Please enter a valid learning time';
    }
    if (!formData.summary.trim()) newErrors['course-summary'] = 'Please fill out this field';
    if (!formData.detail.trim()) newErrors['course-detail'] = 'Please fill out this field';
    if (!coverImageFile && !formData.cover_image_url) {
      newErrors.coverImage = 'Cover image is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNameOnly = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors['course-name'] = 'Please fill out this field';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (
    e: React.FormEvent, 
    status: 'draft' | 'published', 
    lessons: Lesson[], 
    validateNameOnlyFlag = false
  ) => {
    e.preventDefault();
    const isValid = validateNameOnlyFlag ? validateNameOnly() : validateForm();
    if (!isValid) return;

    setIsLoading(true);
    try {
      let coverUrl = formData.cover_image_url || '';
      if (coverImageFile) {
        const fd = new FormData();
        fd.append('coverImage', coverImageFile);
        const res = await fetch('/api/admin/upload-cover', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload cover image');
        coverUrl = data.url;
      }

      const courseData = {
        ...formData,
        id: courseId,
        price: typeof formData.price === 'string' && formData.price ? 
          parseFloat(formData.price) : formData.price || 0,
        total_learning_time: typeof formData.total_learning_time === 'string' && formData.total_learning_time ? 
          parseInt(formData.total_learning_time) : formData.total_learning_time || 0,
        status,
        cover_image_url: coverUrl,
        video_trailer_mux_asset_id: formData.video_trailer_mux_asset_id || null,
        video_trailer_url: formData.video_trailer_url || null,
        lessons_attributes: lessons.map((lesson, index) => ({
          id: lesson.id,
          name: lesson.name,
          order: index,
          sub_lessons_attributes: lesson.subLessons?.map((subLesson, subIndex) => ({
            id: subLesson.id,
            name: subLesson.name,
            order: subIndex,
            video_url: subLesson.videoUrl || subLesson.video_url || '',
            mux_asset_id: subLesson.mux_asset_id || null,
          })) || [],
        })),
      };

      if (isEditMode) {
        await handleEditModeVideoCleanupBeforeSave();
      } else {
        await handleCreateModeVideoCleanupBeforeSave();
      }

      validateVideoStateConsistency();

      const endpoint = isEditMode 
        ? `/api/admin/courses-update/${courseId}`
        : '/api/admin/courses-create';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} course`);

      if (isEditMode) {
        if (newVideoData) {
          setOriginalVideoData({
            video_trailer_mux_asset_id: formData.video_trailer_mux_asset_id,
            video_trailer_url: formData.video_trailer_url,
          });
          setNewVideoData(null);
        }
        setVideoMarkedForDeletion(null);
        setNewVideosHistory([]);
      } else {
        setVideoData(null);
        setNewVideosHistory([]);
      }

      const successMessage = isEditMode
        ? `Course ${status === 'published' ? 'published' : 'updated'} successfully`
        : `Course ${status === 'published' ? 'published' : 'saved as draft'} successfully`;
      
      toastSuccess(successMessage);
      
      if (!isEditMode) {
        localStorage.removeItem('courseFormData');
        localStorage.removeItem('courseLessons');
      }

      router.push('/admin/dashboard?refresh=true');
    } catch (error: any) {
      toastError(`Failed to ${isEditMode ? 'update' : 'create'} course`, error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (isEditMode) {
      await handleEditModeCancel(); 
    } else {
      await handleCreateModeCancel(); 
    }
    if (!isEditMode) {
      localStorage.removeItem('courseFormData');
      localStorage.removeItem('courseLessons');
    }
    router.push('/admin/dashboard');
  };

  const handleEditModeCancel = async () => {
    if (newVideosHistory.length > 0) {
      await cleanupVideos(newVideosHistory, 'cancel in edit mode');
      setNewVideosHistory([]);
      setNewVideoData(null);
      if (originalVideoData?.video_trailer_mux_asset_id && originalVideoData?.video_trailer_url) {
        updateVideoInForm(originalVideoData.video_trailer_mux_asset_id, originalVideoData.video_trailer_url);
      } else {
        clearVideoFromForm();
      }
    }
    if (videoMarkedForDeletion) {
      if (originalVideoData?.video_trailer_mux_asset_id && originalVideoData?.video_trailer_url) {
        updateVideoInForm(originalVideoData.video_trailer_mux_asset_id, originalVideoData.video_trailer_url);
      } else {
        clearVideoFromForm();
      }
      setVideoMarkedForDeletion(null);
    }
  };

  const handleCreateModeCancel = () => {
    if (newVideosHistory.length > 0) {
      cleanupVideos(newVideosHistory, 'cancel in create mode');
      setNewVideosHistory([]);
    }
    if (videoData) {
      setVideoData(null);
    }
  };

  const handleVideoUploadSuccess = (assetId: string, playbackId: string) => {
    if (isEditMode) {
      handleEditModeVideoUpload(assetId, playbackId);
    } else {
      handleCreateModeVideoUpload(assetId, playbackId);
    }
  };

  const handleEditModeVideoUpload = (assetId: string, playbackId: string) => {
    const newVideo = { assetId, playbackId };
    setNewVideoData(newVideo);
    setNewVideosHistory(prev => [...prev, newVideo]);
    updateVideoInForm(assetId, playbackId);
    toastSuccess('Video uploaded successfully! Click "Update" to save changes.');
  };

  const handleCreateModeVideoUpload = (assetId: string, playbackId: string) => {
    const newVideo = { assetId, playbackId };
    setVideoData(newVideo);
    setNewVideosHistory(prev => [...prev, newVideo]);
    updateVideoInForm(assetId, playbackId);
    toastSuccess('Video uploaded successfully!');
  };

  const handleVideoUploadError = (error: string) => {
    toastError('Video upload failed', error);
  };

  const handleVideoDelete = async (assetId?: string | null) => {
    if (isEditMode) {
      await handleEditModeVideoDelete();
    } else {
      await handleCreateModeVideoDelete(assetId);
    }
  };

  const handleEditModeVideoDelete = async () => {
    if (newVideoData) {
      await deleteVideoFromMux(newVideoData.assetId, 'unsaved new video in edit mode');
      setNewVideosHistory(prev => prev.filter(video => video.assetId !== newVideoData.assetId));
      if (originalVideoData?.video_trailer_mux_asset_id && originalVideoData?.video_trailer_url) {
        updateVideoInForm(originalVideoData.video_trailer_mux_asset_id, originalVideoData.video_trailer_url);
      } else {
        clearVideoFromForm();
      }
      setNewVideoData(null);
      toastSuccess('Reverted to original video');
    } else if (videoMarkedForDeletion) {
      if (originalVideoData?.video_trailer_mux_asset_id && originalVideoData?.video_trailer_url) {
        updateVideoInForm(originalVideoData.video_trailer_mux_asset_id, originalVideoData.video_trailer_url);
      }
      setVideoMarkedForDeletion(null);
      toastSuccess('Video restored');
    } else if (originalVideoData?.video_trailer_mux_asset_id) {
      setVideoMarkedForDeletion(originalVideoData.video_trailer_mux_asset_id);
      clearVideoFromForm();
      toastSuccess('Video will be removed when you save changes');
    } else {
      toastSuccess('No video to remove');
    }
  };

  const handleCreateModeVideoDelete = async (assetId?: string | null) => {
    const targetAssetId = assetId || videoData?.assetId;
    if (targetAssetId) {
      setNewVideosHistory(prev => {
        const updatedHistory = prev.filter(video => video.assetId !== targetAssetId);
        if (updatedHistory.length > 0) {
          const latestVideo = updatedHistory[updatedHistory.length - 1];
          setVideoData(latestVideo);
          updateVideoInForm(latestVideo.assetId, latestVideo.playbackId);
        } else {
          setVideoData(null);
          clearVideoFromForm();
        }
        return updatedHistory;
      });
      toastSuccess('Video removed from upload queue');
    } else {
      toastSuccess('No video to remove');
    }
  };

  const [videoUploadState, setVideoUploadState] = useState<{
    isUploading: boolean
    progress: number
    error: string | null
    success: boolean
    currentAssetId?: string | null
  }>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
    currentAssetId: null
  })

  const handleVideoUploadStateChange = useCallback((uploadState: {
    isUploading: boolean
    progress: number
    error: string | null
    success: boolean
    currentAssetId?: string | null
  }) => {
    setVideoUploadState(prev => {
      if (prev.isUploading !== uploadState.isUploading ||
          prev.progress !== uploadState.progress ||
          prev.error !== uploadState.error ||
          prev.success !== uploadState.success ||
          prev.currentAssetId !== uploadState.currentAssetId) {
        return uploadState;
      }
      return prev;
    });
  }, [])

  const cancelVideoUpload = useCallback(async () => {
    if (videoUploadState.currentAssetId) {
      try {
        await fetch(`/api/mux-delete-asset?assetId=${videoUploadState.currentAssetId}`, {
          method: 'DELETE',
        })
      } catch (error) {
      }
    }
    setVideoUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      success: false,
      currentAssetId: null
    })
  }, [videoUploadState.currentAssetId])

  return {
    formData,
    setFormData,
    isLoading,
    setIsLoading,
    coverImageFile,
    setCoverImageFile,
    coverPreview,
    setCoverPreview,
    errors,
    setErrors,
    videoData,
    setVideoData,
    originalVideoData,
    setOriginalVideoData: setOriginalVideoDataStable,
    newVideoData,
    videoMarkedForDeletion,
    coverRef,
    handleCoverClick,
    handleCoverChange,
    handleCoverRemove,
    handleInputChange,
    validateForm,
    validateNameOnly,
    handleSubmit,
    handleCancel,
    isEditMode,
    handleVideoUploadSuccess,
    handleVideoUploadError,
    handleVideoDelete,
    videoUploadState,
    handleVideoUploadStateChange,
    cancelVideoUpload,
  };
};
