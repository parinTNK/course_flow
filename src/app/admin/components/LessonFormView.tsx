import React, { useState, useRef, useCallback } from 'react';
import { ButtonT } from '@/components/ui/ButtonT';
import { Lesson, SubLesson } from '@/types/courseAdmin';
import { DndContext, closestCenter, DragEndEvent }
from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableSubLessonItem } from './SortableSubLessonItem';
import { SubLessonVideoUploadRef } from './SubLessonVideoUpload';
import ConfirmationModal from './ConfirmationModal';
import { useNavigationBlocker } from '@/app/admin/hooks/useNavigationBlocker';

interface LessonFormViewProps {
  courseName: string;
  currentEditingLesson: { 
    id: number | string | null; 
    name: string; 
    title?: string;
    subLessons: SubLesson[] 
  };
  setCurrentEditingLessonName: (name: string) => void;
  handleSaveNewLesson: () => void;
  handleCancelAddLesson: () => void;
  handleAddSubLesson: () => void;
  handleRemoveSubLesson: (id: number | string) => void;
  handleSubLessonNameChange: (id: number | string, newName: string) => void;
  handleDragEndSubLessons: (event: DragEndEvent) => void;
  dndSensors: any;
  handleSubLessonVideoUpdate?: (subLessonId: number | string, assetId: string, playbackId: string) => void;
  handleSubLessonVideoDelete?: (subLessonId: number | string) => void;
  onCancelAllUploads?: () => Promise<void>;
  onRegisterRefs?: (refs: Record<string | number, SubLessonVideoUploadRef | null>) => void;
}

export const LessonFormView: React.FC<LessonFormViewProps> = ({
  courseName, currentEditingLesson, setCurrentEditingLessonName,
  handleSaveNewLesson, handleCancelAddLesson, handleAddSubLesson,
  handleRemoveSubLesson, handleSubLessonNameChange, handleDragEndSubLessons, dndSensors,
  handleSubLessonVideoUpdate, handleSubLessonVideoDelete, onCancelAllUploads, onRegisterRefs
}) => {
  const [videoUploadsState, setVideoUploadsState] = useState<Record<string | number, {
    isUploading: boolean
    progress: number
    error: string | null
    success: boolean
    currentAssetId?: string | null
  }>>({});

  const isUploading = Object.values(videoUploadsState).some(state => state.isUploading);

  const videoUploadRefs = useRef<Record<string | number, SubLessonVideoUploadRef | null>>({});

  React.useEffect(() => {
    if (onRegisterRefs) {
      onRegisterRefs(videoUploadRefs.current);
    }
  }, [onRegisterRefs]);

  const lastLoggedRefs = useRef<string>('');
  const lastRegisteredTime = useRef<number>(0);
  
  React.useEffect(() => {
    if (onRegisterRefs) {
      const timer = setInterval(() => {
        const currentRefs = videoUploadRefs.current;
        const refKeys = Object.keys(currentRefs);
        if (refKeys.length > 0) {
          const refsString = refKeys.sort().join(',');
          const now = Date.now();
          const shouldLog = lastLoggedRefs.current !== refsString && 
                           (now - lastRegisteredTime.current > 5000);
          
          if (shouldLog) {
            console.log('📝 LessonFormView: Video refs updated:', refKeys.length);
            lastLoggedRefs.current = refsString;
            lastRegisteredTime.current = now;
          }
          onRegisterRefs(currentRefs);
        }
      }, 2000);

      return () => clearInterval(timer);
    }
  }, [onRegisterRefs]);

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

  const cancelAllUploads = useCallback(async () => {
    const refCount = Object.keys(videoUploadRefs.current).length;
    if (refCount > 0) {
      console.log(`🚫 LessonFormView: Cancelling ${refCount} video uploads`);
    }
    const cancelPromises = Object.entries(videoUploadRefs.current).map(([id, ref]) => {
      if (ref) {
        return ref.cancelUpload();
      }
      return Promise.resolve();
    });
    await Promise.all(cancelPromises);
    if (onCancelAllUploads) {
      await onCancelAllUploads();
    }
  }, [onCancelAllUploads]);

  const { showConfirmModal, handleConfirmNavigation, handleCancelNavigation, triggerConfirmModal } = useNavigationBlocker({
    isBlocked: isUploading,
    onConfirmNavigation: async () => {
      await cancelAllUploads();
      handleCancelAddLesson();
    }
  });

  const handleCancelButtonClick = () => {
    if (isUploading) {
      triggerConfirmModal();
    } else {
      handleCancelAddLesson();
    }
  };

  const handleBackButtonClick = () => {
    if (isUploading) {
      triggerConfirmModal();
    } else {
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
