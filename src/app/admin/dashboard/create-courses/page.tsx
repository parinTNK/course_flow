'use client';

import React, { useState, useEffect } from 'react';
import { useCourseForm } from '@/app/admin/hooks/useCourseForm';
import { useLessonManagement } from '@/app/admin/hooks/useLessonManagement';
import { CourseFormView } from '@/app/admin/components/CourseFormView';
import { LessonFormView } from '@/app/admin/components/LessonFormView';
import { PromoCode } from '@/types/courseAdmin';
import { useCustomToast } from '@/components/ui/CustomToast';

function CreateCourse() {
  const { success, error } = useCustomToast();
  const [allPromoCodes, setAllPromoCodes] = useState<PromoCode[]>([]);
  
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
    setFormData,
  } = useCourseForm();

  const lessonManagement = useLessonManagement(formData.name);

  useEffect(() => {
    // Fetch all promo codes when the component mounts
    const fetchPromoCodes = async () => {
      try {
        const response = await fetch('/api/admin/promo-codes');
        if (!response.ok) throw new Error('Failed to fetch promo codes');
        const data = await response.json();
        setAllPromoCodes(data);
      } catch (error) {
        console.error('Error fetching promo codes:', error);
        error('Error', 'Could not load promo codes.');
      }
    };

    fetchPromoCodes();
  }, [error]);

  const handleSubmitWithLessons = (
    e: React.FormEvent,
    status: 'draft' | 'published',
    validateNameOnlyFlag = false
  ) => {
    originalHandleSubmit(e, status, lessonManagement.lessons, validateNameOnlyFlag);
  };
  
  const setCurrentEditingLessonName = (name: string) => {
    // Use our new method that sets both name and title
    lessonManagement.setCurrentEditingLessonName(name);
  };

  const handlePromoCodeChange = (selectedPromoCode: PromoCode | null) => {
    setFormData(prev => ({ ...prev, promo_code_id: selectedPromoCode ? selectedPromoCode.id : null }));
  };

  const showErrorToast = (title: string, description?: string) => {
    error(title, description);
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
          allPromoCodes={allPromoCodes}
          handlePromoCodeChange={handlePromoCodeChange}
          showError={showErrorToast}
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
