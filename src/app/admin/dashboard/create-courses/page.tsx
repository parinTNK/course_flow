'use client';

import React, { useState, useEffect } from 'react';
import { useCourseForm } from '@/app/admin/hooks/useCourseForm';
import { useLessonManagement } from '@/app/admin/hooks/useLessonManagement';
import { CourseFormView } from '@/app/admin/components/CourseFormView';
import { LessonFormView } from '@/app/admin/components/LessonFormView';
import { useCustomToast } from '@/components/ui/CustomToast';

function CreateCourse() {
  const { success, error } = useCustomToast();
  
  const {
    formData,
    isLoading,
    errors,
    coverPreview,
    coverRef,
    handleInputChange,
    handleCoverClick,
    handleCoverChange,
    handleCoverRemove,
    handleSubmit: originalHandleSubmit,
    handleCancel,
    setFormData,
    handleVideoUploadSuccess,
    handleVideoUploadError,
    handleVideoDelete,
    videoMarkedForDeletion,
    handlePromoCodeChange,
    videoUploadState,
    handleVideoUploadStateChange,
    cancelVideoUpload,
  } = useCourseForm();

  const lessonManagement = useLessonManagement('');

  useEffect(() => {
    if (formData.name) {
      lessonManagement.updateCourseName(formData.name);
    }
  }, [formData.name, lessonManagement]);

  const handleSubmitWithLessons = (
    e: React.FormEvent,
    status: 'draft' | 'published',
    validateNameOnlyFlag = false
  ) => {
    originalHandleSubmit(e, status, lessonManagement.lessons, validateNameOnlyFlag);
  };
  
  const setCurrentEditingLessonName = (name: string) => {
    lessonManagement.setCurrentEditingLessonName(name);
  };

  const handleCancelWithCleanup = async () => {
    try {
      await lessonManagement.cancelAllUploads();
    } catch (error) {
      console.error('❌ CreateCourse: Error cancelling sub-lesson uploads:', error);
    }
    
    handleCancel();
  };

  return (
    <div className="bg-gray-100 flex-1 pb-10">
      {!lessonManagement.isAddLessonView ? (
        <CourseFormView
          formData={formData}
          errors={errors}
          isLoading={isLoading}
          coverPreview={coverPreview}
          coverRef={coverRef}
          lessons={lessonManagement.lessons}
          handleInputChange={handleInputChange}
          handleCoverClick={handleCoverClick}
          handleCoverChange={handleCoverChange}
          handleCoverRemove={handleCoverRemove}
          handleSubmit={handleSubmitWithLessons}
          handleCancel={handleCancelWithCleanup}
          handleAddLesson={lessonManagement.handleAddLesson}
          handleDeleteLesson={lessonManagement.handleDeleteLesson}
          handleEditLesson={lessonManagement.handleEditLesson}
          handleDragEndLessons={lessonManagement.handleDragEndLessons}
          handleVideoUploadSuccess={handleVideoUploadSuccess}
          handleVideoUploadError={handleVideoUploadError}
          handleVideoDelete={handleVideoDelete}
          videoMarkedForDeletion={videoMarkedForDeletion}
          dndSensors={lessonManagement.sensors}
          videoUploadState={videoUploadState}
          handleVideoUploadStateChange={handleVideoUploadStateChange}
          cancelVideoUpload={cancelVideoUpload}
          handlePromoCodeChange={handlePromoCodeChange}
        />
      ) : (
        <LessonFormView
          courseName={formData.name}
          currentEditingLesson={lessonManagement.currentEditingLesson}
          setCurrentEditingLessonName={setCurrentEditingLessonName}
          handleSaveNewLesson={lessonManagement.handleSaveNewLesson}
          handleCancelAddLesson={lessonManagement.handleCancelAddLesson}
          handleAddSubLesson={lessonManagement.handleAddSubLesson}
          handleRemoveSubLesson={lessonManagement.handleRemoveSubLesson}
          handleSubLessonNameChange={lessonManagement.handleSubLessonNameChange}
          handleDragEndSubLessons={lessonManagement.handleDragEndSubLessons}
          dndSensors={lessonManagement.sensors}
          handleSubLessonVideoUpdate={lessonManagement.handleSubLessonVideoUpdate}
          handleSubLessonVideoDelete={lessonManagement.handleSubLessonVideoDelete}
          onCancelAllUploads={lessonManagement.cancelAllUploads}
          onRegisterRefs={lessonManagement.registerSubLessonVideoRefs}
        />
      )}
    </div>
  );
}

export default CreateCourse;
