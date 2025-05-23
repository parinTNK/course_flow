'use client';

import React from 'react';
import { useCourseForm } from '@/app/admin/hooks/useCourseForm';
import { useLessonManagement } from '@/app/admin/hooks/useLessonManagement';
import { CourseFormView } from '@/app/admin/components/CourseFormView';
import { LessonFormView } from '@/app/admin/components/LessonFormView';

function CreateCourse() {
  const {
    formData,
    isLoading,
    errors,
    coverPreview,
    coverRef,
    handleInputChange,
    handleCoverClick,
    handleCoverChange,
    handleSubmit: originalHandleSubmit,
    handleCancel,
  } = useCourseForm();

  const lessonManagement = useLessonManagement(formData.name);

  const handleSubmitWithLessons = (
    e: React.FormEvent,
    status: 'draft' | 'published',
    validateNameOnlyFlag = false
  ) => {
    originalHandleSubmit(e, status, lessonManagement.lessons, validateNameOnlyFlag);
  };
  
  const setCurrentEditingLessonName = (name: string) => {
    lessonManagement.setCurrentEditingLesson(prev => ({ ...prev, name }));
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
          handleSubmit={handleSubmitWithLessons}
          handleCancel={handleCancel}
          handleAddLesson={lessonManagement.handleAddLesson}
          handleDeleteLesson={lessonManagement.handleDeleteLesson}
          handleEditLesson={lessonManagement.handleEditLesson}
          handleDragEndLessons={lessonManagement.handleDragEndLessons}
          dndSensors={lessonManagement.sensors}
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
        />
      )}

      test
    </div>
  );
}

export default CreateCourse;
