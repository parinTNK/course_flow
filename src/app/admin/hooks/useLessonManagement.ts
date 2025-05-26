import { useState, useEffect, useRef, useCallback } from 'react';
import { useCustomToast } from '@/components/ui/CustomToast';
import { Lesson, SubLesson } from '@/types/courseAdmin';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { SubLessonVideoUploadRef } from '@/app/admin/components/SubLessonVideoUpload';

export const useLessonManagement = (courseName: string) => {
  const { success: toastSuccess, error: toastError } = useCustomToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isAddLessonView, setIsAddLessonView] = useState(false);
  const [currentEditingLesson, setCurrentEditingLesson] = useState<{
    id: number | string | null;
    name: string;
    title?: string; // Add database field name
    subLessons: SubLesson[];
  }>({
    id: null,
    name: '',
    title: '', // Initialize database field
    subLessons: [{ 
      id: Date.now(), 
      name: '', 
      title: '', // Initialize database field
      videoUrl: '',
      video_url: '', // Initialize database field
      mux_asset_id: '', // Initialize Mux asset ID
      videoUploadState: { // Initialize video upload state
        isUploading: false,
        hasVideo: false,
        error: undefined
      }
    }]
  });
  
  // Store the courseName in a ref to prevent unnecessary re-renders
  const courseNameRef = useRef(courseName);

  // State to track all sub-lesson video upload states for navigation prevention
  const [subLessonUploadStates, setSubLessonUploadStates] = useState<Record<string | number, {
    isUploading: boolean;
    progress: number;
    error: string | null;
    success: boolean;
    currentAssetId?: string | null;
  }>>({});

  // Refs to manage sub-lesson video upload components
  const subLessonVideoRefs = useRef<Record<string | number, SubLessonVideoUploadRef>>({});

  useEffect(() => {
    const savedLessons = localStorage.getItem('courseLessons');
    if (savedLessons) {
      try {
        setLessons(JSON.parse(savedLessons));
      } catch (error) {
        console.error('Error parsing saved lessons:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('courseLessons', JSON.stringify(lessons));
  }, [lessons]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Method to update courseName from outside
  const updateCourseName = useCallback((name: string) => {
    courseNameRef.current = name;
  }, []);

  const handleAddLesson = () => {
    if (!courseNameRef.current.trim()) {
      toastError('Please enter course name before adding lessons');
      return;
    }
    setCurrentEditingLesson({
      id: null,
      name: '',
      title: '', // Add both fields for consistency
      subLessons: [{ 
        id: Date.now(), 
        name: '', 
        title: '', // Add database field name
        videoUrl: '',
        video_url: '', // Add database field name
        mux_asset_id: '', // Initialize Mux asset ID
        videoUploadState: { // Initialize video upload state
          isUploading: false,
          hasVideo: false,
          error: undefined
        }
      }]
    });
    setIsAddLessonView(true);
  };

  const handleSaveNewLesson = () => {
    if (!currentEditingLesson.name.trim()) {
      toastError('Lesson name is required');
      return;
    }
    const hasEmptySubLesson = currentEditingLesson.subLessons.some(sl => !sl.name.trim() && !sl.title?.trim());
    if (hasEmptySubLesson) {
      toastError('All sub-lesson names are required');
      return;
    }
    
    if (currentEditingLesson.id === null) { // New lesson
      // For new lessons, use a temporary ID format with timestamp
      const newId = `temp-${Date.now()}`;
      
      // Prepare subLessons with all the necessary field mappings
      const normalizedSubLessons = currentEditingLesson.subLessons.map(sl => ({
        ...sl,
        // Ensure both frontend and database field names exist
        name: sl.name || sl.title || '',
        title: sl.title || sl.name || '',
        videoUrl: sl.videoUrl || sl.video_url || '',
        video_url: sl.video_url || sl.videoUrl || '',
        mux_asset_id: sl.mux_asset_id || ''
      }));
      
      setLessons([...lessons, { 
        ...currentEditingLesson, 
        id: newId,
        // Set both for compatibility with different components
        sub_lessons_attributes: normalizedSubLessons,
        subLessons: normalizedSubLessons,
        sub_lessons: normalizedSubLessons
      }]);
      toastSuccess('Lesson added successfully');
    } else { // Editing existing lesson
      // Prepare subLessons with all the necessary field mappings
      const normalizedSubLessons = currentEditingLesson.subLessons.map(sl => ({
        ...sl,
        // Ensure both frontend and database field names exist
        name: sl.name || sl.title || '',
        title: sl.title || sl.name || '',
        videoUrl: sl.videoUrl || sl.video_url || '',
        video_url: sl.video_url || sl.videoUrl || '',
        mux_asset_id: sl.mux_asset_id || ''
      }));
      
      setLessons(lessons.map(lesson =>
        lesson.id === currentEditingLesson.id ? { 
          ...lesson,
          name: currentEditingLesson.name,
          title: currentEditingLesson.name, // Add title for database consistency
          // Keep the existing structure but update all versions of subLessons
          sub_lessons_attributes: normalizedSubLessons,
          subLessons: normalizedSubLessons,
          sub_lessons: normalizedSubLessons
        } : lesson
      ));
      toastSuccess('Lesson updated successfully');
    }
    setIsAddLessonView(false);
  };

  const handleCancelAddLesson = () => setIsAddLessonView(false);

  const handleAddSubLesson = () => {
    // For new sub-lessons, use a timestamp-based ID to ensure uniqueness
    const newId = Date.now();
    
    setCurrentEditingLesson(prev => ({
      ...prev,
      subLessons: [...prev.subLessons, { 
        id: newId, 
        name: '', 
        title: '',  // Add database field
        videoUrl: '', 
        video_url: '',  // Add database field
        mux_asset_id: '', // Initialize Mux asset ID
        videoUploadState: { // Initialize video upload state
          isUploading: false,
          hasVideo: false,
          error: undefined
        }
      }]
    }));
  };

  const handleRemoveSubLesson = (idToRemove: number | string) => {
    if (currentEditingLesson.subLessons.length <= 1) {
      toastError('You need at least one sub-lesson');
      return;
    }
    setCurrentEditingLesson(prev => ({
      ...prev,
      subLessons: prev.subLessons.filter(sl => sl.id !== idToRemove)
    }));
  };

  const handleSubLessonNameChange = (id: number | string, newName: string) => {
    setCurrentEditingLesson(prev => ({
      ...prev,
      subLessons: prev.subLessons.map(sl =>
        sl.id === id ? { 
          ...sl, 
          name: newName,  // Frontend property
          title: newName  // Database property
        } : sl
      )
    }));
  };

  // Video management functions for sub-lessons
  const handleSubLessonVideoUpdate = (subLessonId: number | string, assetId: string, playbackId: string) => {
    setCurrentEditingLesson(prev => ({
      ...prev,
      subLessons: prev.subLessons.map(sl =>
        sl.id === subLessonId ? {
          ...sl,
          video_url: playbackId,      // Store playback ID in database field
          videoUrl: playbackId,       // Frontend field
          mux_asset_id: assetId,      // Store Mux asset ID
          videoUploadState: {
            isUploading: false,
            hasVideo: true,
            error: undefined
          }
        } : sl
      )
    }));
    toastSuccess('Video uploaded successfully');
  };

  const handleSubLessonVideoDelete = (subLessonId: number | string) => {
    setCurrentEditingLesson(prev => ({
      ...prev,
      subLessons: prev.subLessons.map(sl =>
        sl.id === subLessonId ? {
          ...sl,
          video_url: '',              // Clear playback ID
          videoUrl: '',               // Clear frontend field
          mux_asset_id: '',           // Clear Mux asset ID
          videoUploadState: {
            isUploading: false,
            hasVideo: false,
            error: undefined
          }
        } : sl
      )
    }));
    toastSuccess('Video deleted successfully');
  };

  const handleSubLessonVideoUploadStart = (subLessonId: number | string) => {
    setCurrentEditingLesson(prev => ({
      ...prev,
      subLessons: prev.subLessons.map(sl =>
        sl.id === subLessonId ? {
          ...sl,
          videoUploadState: {
            isUploading: true,
            hasVideo: false,
            error: undefined
          }
        } : sl
      )
    }));
  };

  const handleSubLessonVideoUploadError = (subLessonId: number | string, error: string) => {
    setCurrentEditingLesson(prev => ({
      ...prev,
      subLessons: prev.subLessons.map(sl =>
        sl.id === subLessonId ? {
          ...sl,
          videoUploadState: {
            isUploading: false,
            hasVideo: false,
            error
          }
        } : sl
      )
    }));
    toastError(`Video upload failed: ${error}`);
  };

  // Handle sub-lesson video upload state changes for navigation prevention
  const handleSubLessonVideoUploadStateChange = (subLessonId: string | number, uploadState: {
    isUploading: boolean;
    progress: number;
    error: string | null;
    success: boolean;
    currentAssetId?: string | null;
  }) => {
    setSubLessonUploadStates(prev => ({
      ...prev,
      [subLessonId]: uploadState
    }));
  };

  // Cancel all sub-lesson video uploads
  const cancelAllSubLessonVideoUploads = async () => {
    const cancelPromises = Object.entries(subLessonVideoRefs.current).map(async ([subLessonId, ref]) => {
      const uploadState = subLessonUploadStates[subLessonId];
      if (uploadState?.isUploading && ref?.cancelUpload) {
        try {
          await ref.cancelUpload();
        } catch (error) {
          console.error(`Failed to cancel upload for sub-lesson ${subLessonId}:`, error);
        }
      }
    });

    await Promise.all(cancelPromises);
  };

  // Method to register sub-lesson video refs from external components
  const lastRegisteredRefs = useRef<string>('');
  const lastRegistrationTime = useRef<number>(0);
  
  const registerSubLessonVideoRefs = useCallback((refs: Record<string | number, SubLessonVideoUploadRef>) => {
    const refKeys = Object.keys(refs).sort().join(',');
    const now = Date.now();
    
    // Only log significant changes and not too frequently
    const shouldLog = lastRegisteredRefs.current !== refKeys && 
                     refKeys && 
                     (now - lastRegistrationTime.current > 10000); // Log at most every 10 seconds
    
    if (shouldLog) {
      console.log('📝 useLessonManagement: Video refs registered:', Object.keys(refs).length);
      lastRegisteredRefs.current = refKeys;
      lastRegistrationTime.current = now;
    }
    subLessonVideoRefs.current = { ...subLessonVideoRefs.current, ...refs };
  }, []);

  // Cancel all active video uploads
  const cancelAllUploads = async () => {
    const refKeys = Object.keys(subLessonVideoRefs.current);
    if (refKeys.length > 0) {
      console.log(`🚫 useLessonManagement: Cancelling ${refKeys.length} video uploads`);
    }
    
    // Gather all cancel promises
    const cancelPromises = Object.entries(subLessonVideoRefs.current).map(([id, ref]) => {
      if (ref) {
        try {
          return ref.cancelUpload();
        } catch (error) {
          console.error(`❌ useLessonManagement: Failed to cancel upload for sub-lesson ${id}:`, error);
          return Promise.resolve();
        }
      }
      return Promise.resolve();
    });
    
    // Execute all cancel operations
    await Promise.all(cancelPromises);
    
    if (refKeys.length > 0) {
      console.log(`✅ useLessonManagement: All uploads cancelled successfully`);
    }
  };

  // Check if any sub-lesson videos are currently uploading
  const hasActiveSubLessonUploads = () => {
    return Object.values(subLessonUploadStates).some(state => state.isUploading);
  };

  // Set ref for sub-lesson video upload component
  const setSubLessonVideoRef = (subLessonId: string | number, ref: SubLessonVideoUploadRef | null) => {
    if (ref) {
      subLessonVideoRefs.current[subLessonId] = ref;
    } else {
      delete subLessonVideoRefs.current[subLessonId];
    }
  };

  // Add a method to set both name and title fields for consistency
  const setCurrentEditingLessonName = (newName: string) => {
    setCurrentEditingLesson(prev => ({
      ...prev,
      name: newName,  // Frontend property
      title: newName  // Database property
    }));
  };

  const handleEditLesson = (id: number | string) => {
    const lessonToEdit = lessons.find((lesson) => lesson.id === id);
    if (lessonToEdit) {
      // Get subLessons from any of the possible sources, prioritizing populated ones
      const subLessonsSource = 
        (Array.isArray(lessonToEdit.subLessons) && lessonToEdit.subLessons.length > 0) ? lessonToEdit.subLessons :
        (Array.isArray(lessonToEdit.sub_lessons) && lessonToEdit.sub_lessons.length > 0) ? lessonToEdit.sub_lessons : 
        (Array.isArray(lessonToEdit.sub_lessons_attributes) && lessonToEdit.sub_lessons_attributes.length > 0) ? lessonToEdit.sub_lessons_attributes : 
        [];
      
      // Normalize each subLesson with all field names for consistency
      const normalizedSubLessons = subLessonsSource.map(sl => ({
        ...sl,
        id: sl.id,
        name: sl.name || sl.title || '',
        title: sl.title || sl.name || '',
        videoUrl: sl.videoUrl || sl.video_url || '',
        video_url: sl.video_url || sl.videoUrl || '',
        mux_asset_id: sl.mux_asset_id || '',
        videoUploadState: sl.videoUploadState || {
          isUploading: false,
          hasVideo: !!(sl.video_url || sl.videoUrl),
          error: undefined
        }
      }));
      
      setCurrentEditingLesson({
        id: lessonToEdit.id,
        name: lessonToEdit.name || lessonToEdit.title || '',
        title: lessonToEdit.title || lessonToEdit.name || '', // Ensure title is also set
        subLessons: normalizedSubLessons
      });
      setIsAddLessonView(true);
    }
  };

  const handleDeleteLesson = (id: number | string) => {
    setLessons(prevLessons => prevLessons.filter((lesson) => lesson.id !== id));
    toastSuccess('Lesson deleted successfully');
  };

  const handleDragEndLessons = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLessons((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  const handleDragEndSubLessons = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        setCurrentEditingLesson(prev => {
            const oldIndex = prev.subLessons.findIndex(item => item.id === active.id);
            const newIndex = prev.subLessons.findIndex(item => item.id === over.id);
            return {
                ...prev,
                subLessons: arrayMove(prev.subLessons, oldIndex, newIndex)
            };
        });
    }
  };

  return {
    lessons,
    setLessons,
    isAddLessonView,
    setIsAddLessonView,
    currentEditingLesson,
    setCurrentEditingLesson,
    sensors,
    handleAddLesson,
    handleSaveNewLesson,
    handleCancelAddLesson,
    handleAddSubLesson,
    handleRemoveSubLesson,
    handleSubLessonNameChange,
    handleEditLesson,
    handleDeleteLesson,
    handleDragEndLessons,
    handleDragEndSubLessons,
    setCurrentEditingLessonName, // Expose the new method
    // Video management functions
    handleSubLessonVideoUpdate,
    handleSubLessonVideoDelete,
    handleSubLessonVideoUploadStart,
    handleSubLessonVideoUploadError,
    // Cancel uploads
    cancelAllUploads,
    registerSubLessonVideoRefs,
    // Course name management
    updateCourseName,
  };
};
