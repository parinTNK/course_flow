import React, { useState, useRef, useCallback } from 'react';
import { ButtonT } from '@/components/ui/ButtonT';
import { Lesson, SubLesson } from '@/types/courseAdmin'; // Assuming SubLesson is also in types
import { DndContext, closestCenter, DragEndEvent }
from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableSubLessonItem } from './SortableSubLessonItem'; // Adjusted import
import { SubLessonVideoUploadRef } from './SubLessonVideoUpload';
import ConfirmationModal from './ConfirmationModal';
import { useNavigationBlocker } from '@/app/admin/hooks/useNavigationBlocker';

interface LessonFormViewProps {
  courseName: string;
  currentEditingLesson: { 
    id: number | string | null; 
    name: string; 
    title?: string; // Add database field name
    subLessons: SubLesson[] 
  };
  setCurrentEditingLessonName: (name: string) => void;
  handleSaveNewLesson: () => void;
  handleCancelAddLesson: () => void;
  handleAddSubLesson: () => void;
  handleRemoveSubLesson: (id: number | string) => void;
  handleSubLessonNameChange: (id: number | string, newName: string) => void;
  handleDragEndSubLessons: (event: DragEndEvent) => void;
  dndSensors: any; // Type properly
  // Video management functions
  handleSubLessonVideoUpdate?: (subLessonId: number | string, assetId: string, playbackId: string) => void;
  handleSubLessonVideoDelete?: (subLessonId: number | string) => void;
  // Optional callback for cancelling all uploads before navigation
  onCancelAllUploads?: () => Promise<void>;
  // Optional callback to register refs with parent
  onRegisterRefs?: (refs: Record<string | number, SubLessonVideoUploadRef | null>) => void;
}

export const LessonFormView: React.FC<LessonFormViewProps> = ({
  courseName, currentEditingLesson, setCurrentEditingLessonName,
  handleSaveNewLesson, handleCancelAddLesson, handleAddSubLesson,
  handleRemoveSubLesson, handleSubLessonNameChange, handleDragEndSubLessons, dndSensors,
  handleSubLessonVideoUpdate, handleSubLessonVideoDelete, onCancelAllUploads, onRegisterRefs
}) => {
  // Manage video upload state
  const [videoUploadsState, setVideoUploadsState] = useState<Record<string | number, {
    isUploading: boolean
    progress: number
    error: string | null
    success: boolean
    currentAssetId?: string | null
  }>>({});

  // Keep track of any active uploads
  const isUploading = Object.values(videoUploadsState).some(state => state.isUploading);

  // Store refs to all video uploaders for cancellation
  const videoUploadRefs = useRef<Record<string | number, SubLessonVideoUploadRef | null>>({});

  // Register refs with parent when they change
  React.useEffect(() => {
    if (onRegisterRefs) {
      onRegisterRefs(videoUploadRefs.current);
    }
  }, [onRegisterRefs]);

  // Also register refs whenever the refs object changes
  const lastLoggedRefs = useRef<string>('');
  const lastRegisteredTime = useRef<number>(0);
  
  React.useEffect(() => {
    if (onRegisterRefs) {
      const timer = setInterval(() => {
        const currentRefs = videoUploadRefs.current;
        const refKeys = Object.keys(currentRefs);
        if (refKeys.length > 0) {
          // Only log significant changes and not too frequently
          const refsString = refKeys.sort().join(',');
          const now = Date.now();
          const shouldLog = lastLoggedRefs.current !== refsString && 
                           (now - lastRegisteredTime.current > 5000); // Log at most every 5 seconds
          
          if (shouldLog) {
            console.log('📝 LessonFormView: Video refs updated:', refKeys.length);
            lastLoggedRefs.current = refsString;
            lastRegisteredTime.current = now;
          }
          onRegisterRefs(currentRefs);
        }
      }, 2000); // Check every 2 seconds (less frequent)

      return () => clearInterval(timer);
    }
  }, [onRegisterRefs]);

  // Handle video upload state change
  const handleVideoUploadStateChange = React.useCallback((subLessonId: number | string, state: {
    isUploading: boolean
    progress: number
    error: string | null
    success: boolean
    currentAssetId?: string | null
  }) => {
    setVideoUploadsState(prev => ({
      ...prev,
      [subLessonId]: state
    }));
  }, []);

  // Cancel all active uploads
  const cancelAllUploads = useCallback(async () => {
    const refCount = Object.keys(videoUploadRefs.current).length;
    if (refCount > 0) {
      console.log(`🚫 LessonFormView: Cancelling ${refCount} video uploads`);
    }
    
    // Cancel uploads via refs
    const cancelPromises = Object.entries(videoUploadRefs.current).map(([id, ref]) => {
      if (ref) {
        return ref.cancelUpload();
      }
      return Promise.resolve();
    });
    
    await Promise.all(cancelPromises);
    
    // Also call parent cancellation if provided
    if (onCancelAllUploads) {
      await onCancelAllUploads();
    }
  }, [onCancelAllUploads]);

  // Navigation blocker
  const { showConfirmModal, handleConfirmNavigation, handleCancelNavigation, triggerConfirmModal } = useNavigationBlocker({
    isBlocked: isUploading,
    onConfirmNavigation: async () => {
      await cancelAllUploads();
      handleCancelAddLesson();
    }
  });

  // Handler for Cancel button click
  const handleCancelButtonClick = () => {
    if (isUploading) {
      // Show confirmation modal when video is uploading
      triggerConfirmModal();
    } else {
      // Direct cancel when no upload in progress
      handleCancelAddLesson();
    }
  };

  // Handler for back arrow button click
  const handleBackButtonClick = () => {
    if (isUploading) {
      // Show confirmation modal when video is uploading
      triggerConfirmModal();
    } else {
      // Direct navigation when no upload in progress
      handleCancelAddLesson();
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={handleBackButtonClick} className="mr-4 text-gray-500 hover:text-gray-700">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className='flex flex-row items-center space-x-2'>
              <h1 className="text-3xl font-semibold">
                {currentEditingLesson.id === null ? 'Add Lesson' : 'Edit Lesson'}
              </h1>
               <div className="text-3xl font-bold text-gray-500">Course: '{courseName}'</div>
            </div>
          </div>
          <div className="flex space-x-2">
            <ButtonT 
              variant="Secondary" 
              onClick={handleCancelButtonClick}
            >
              Cancel
            </ButtonT>
            <ButtonT 
                variant="primary" 
                onClick={handleSaveNewLesson}
                disabled={isUploading}
              >
                {currentEditingLesson.id === null ? 'Create' : 'Update'}
              </ButtonT>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <label className="block text-sm font-medium mb-1">
              Lesson name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Enter lesson name"
              value={currentEditingLesson.name || currentEditingLesson.title || ''}
              onChange={(e) => {
                setCurrentEditingLessonName(e.target.value);
              }}
            />
          </div>
          <div>
            <h2 className="text-lg font-medium mb-4">Sub-Lesson</h2>
            <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSubLessons}>
              <SortableContext items={currentEditingLesson.subLessons.map(sl => sl.id)} strategy={verticalListSortingStrategy}>
                {currentEditingLesson.subLessons.map((subLesson) => (
                  <SortableSubLessonItem
                    key={subLesson.id}
                    subLesson={subLesson}
                    onRemove={handleRemoveSubLesson}
                    onNameChange={handleSubLessonNameChange}
                    onVideoUpdate={handleSubLessonVideoUpdate}
                    onVideoDelete={handleSubLessonVideoDelete}
                    onVideoUploadStateChange={handleVideoUploadStateChange}
                    videoUploadRefs={videoUploadRefs}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <button
              type="button"
              onClick={handleAddSubLesson}
              disabled={isUploading}
              className={`mt-4 inline-flex items-center px-4 py-2 border border-orange-500 text-orange-500 rounded-md ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-50'}`}
            >
              + Add Sub-lesson
            </button>
          </div>
        </div>
      </main>

      {/* Navigation Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmNavigation}
        onClose={handleCancelNavigation}
        title="Video Upload in Progress"
        message="Video upload is still in progress. If you leave this page, the upload will be cancelled. Do you want to continue?"
        confirmText="Yes, Leave Page"
        cancelText="Stay on Page"
        confirmButtonClass="bg-red-500 text-white hover:bg-red-600"
      />
    </div>
  );
};
