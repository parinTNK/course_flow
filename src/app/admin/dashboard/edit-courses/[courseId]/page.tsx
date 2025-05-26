'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CourseFormView } from '@/app/admin/components/CourseFormView';
import { LessonFormView } from '@/app/admin/components/LessonFormView'; // Import LessonFormView
import { Lesson, PromoCode } from '@/types/courseAdmin';
import { useCustomToast } from '@/components/ui/CustomToast';
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCourseForm } from '@/app/admin/hooks/useCourseForm';
import { useLessonManagement } from '@/app/admin/hooks/useLessonManagement';

const EditCoursePage = () => {
  const params = useParams();
  const { courseId } = params;
  const { error } = useCustomToast();

  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [allPromoCodes, setAllPromoCodes] = useState<PromoCode[]>([]);

  // Initialize useCourseForm hook with courseId for edit mode
  const {
    formData,
    setFormData,
    isLoading,
    setIsLoading,
    coverImageFile,
    coverPreview,
    setCoverPreview,
    errors,
    setErrors,
    coverRef,
    handleCoverClick,
    handleCoverChange,
    handleInputChange,
    handleSubmit,
    handleCancel,
  } = useCourseForm({ courseId: courseId as string });

  // Initialize with our useLessonManagement hook for better field handling
  // formData.name might be empty initially, this is acceptable for now as courseName is mainly for a toast in the hook.
  const lessonManagement = useLessonManagement(formData.name || '');


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      setIsLoading(true); // Use from useCourseForm
      try {
        const response = await fetch(`/api/admin/courses/${courseId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch course data');
        }
        const data = await response.json();
        
        // Set form data with the response
        setFormData({
          id: courseId as string,
          name: data.name || '',
          price: data.price || 0,
          total_learning_time: data.total_learning_time || 0,
          summary: data.summary || '',
          detail: data.detail || '',
          status: data.status || 'draft',
          cover_image_url: data.cover_image_url || null,
          promo_code_id: data.promo_code_id || null,
        });

        // Process lessons to ensure all field names are consistent
        const normalizedLessons = (data.lessons_attributes || data.lessons || []).map(lesson => {
          // Get subLessons from any available property
          const subLessonsSource = 
            lesson.sub_lessons_attributes || lesson.subLessons || lesson.sub_lessons || [];
          
          // Normalize subLessons to have all field variations
          const normalizedSubLessons = subLessonsSource.map(sl => ({
            ...sl,
            id: sl.id,
            name: sl.name || sl.title || '',
            title: sl.title || sl.name || '',
            videoUrl: sl.videoUrl || sl.video_url || '',
            video_url: sl.video_url || sl.videoUrl || '',
            order: sl.order || sl.order_no || 0,
            order_no: sl.order_no || sl.order || 0
          }));
          
          return {
            ...lesson,
            id: lesson.id,
            name: lesson.name || lesson.title || '',
            title: lesson.title || lesson.name || '',
            order: lesson.order || lesson.order_no || 0,
            order_no: lesson.order_no || lesson.order || 0,
            // Set all variations of subLessons properties
            sub_lessons_attributes: normalizedSubLessons,
            subLessons: normalizedSubLessons,
            sub_lessons: normalizedSubLessons
          };
        });

        // Set lessons state for DnD functionality using lessonManagement
        lessonManagement.setLessons(normalizedLessons);
        
        // Set cover preview if available
        if (data.cover_image_url) {
          setCoverPreview(data.cover_image_url);
        }
        
        setInitialDataLoaded(true);
      } catch (error: any) {
        console.error('Error fetching course:', error);
        error('Error', 'Could not load course data.');
      }
      setIsLoading(false); // Use from useCourseForm
    };

    const fetchPromoCodes = async () => {
      try {
        const response = await fetch('/api/admin/promo-codes');
        if (!response.ok) {
          throw new Error('Failed to fetch promo codes');
        }
        const data = await response.json();
        setAllPromoCodes(data);
      } catch (error: any) {
        console.error('Error fetching promo codes:', error);
        error('Error', 'Could not load promo codes.');
      }
    };

    fetchCourseData();
    fetchPromoCodes();
  }, [courseId, setFormData, setCoverPreview, setIsLoading, lessonManagement.setLessons]); // Removed error from dependencies

  const handlePromoCodeChange = (selectedPromoCode: PromoCode | null) => {
    setFormData(prev => ({ ...prev, promo_code_id: selectedPromoCode ? selectedPromoCode.id : null }));
  };

  const handleDragEndLessons = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      lessonManagement.setLessons((items) => { // Use lessonManagement
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newItems = Array.from(items);
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  };
  
  // Helper function for CourseFormView to show errors via toast
  const showErrorToast = (title: string, description?: string) => {
    error(title, description);
  };

  // Show loading state until initial data is loaded
  if (isLoading && !initialDataLoaded) { // Use isLoading from useCourseForm
    return <div className="flex justify-center items-center h-screen"><p>Loading course data...</p></div>;
  }

  // Use the handleSubmit from useCourseForm but adapt it for our component's needs
  const submitHandler = (e: React.FormEvent, status: 'draft' | 'published', validateNameOnlyFlag = false) => {
    handleSubmit(e, status, lessonManagement.lessons, validateNameOnlyFlag); // Use lessonManagement.lessons
  };

  return (
    // Add a wrapper div similar to create-courses page if needed, e.g., for styling
    <div className="bg-gray-100 flex-1 pb-10"> 
      {!lessonManagement.isAddLessonView ? (
        <CourseFormView
          formData={formData}
          errors={errors}
          isLoading={isLoading}
          coverPreview={coverPreview}
          coverRef={coverRef}
          lessons={lessonManagement.lessons}
          allPromoCodes={allPromoCodes}
          handleInputChange={handleInputChange}
          handleCoverClick={handleCoverClick}
          handleCoverChange={handleCoverChange}
          handleSubmit={submitHandler}
          handleCancel={handleCancel}
          handleAddLesson={lessonManagement.handleAddLesson}
          handleDeleteLesson={lessonManagement.handleDeleteLesson} // Use from hook
          handleEditLesson={lessonManagement.handleEditLesson} // Use from hook
          handleDragEndLessons={handleDragEndLessons}
          handlePromoCodeChange={handlePromoCodeChange}
          showError={showErrorToast}
          dndSensors={sensors}
        />
      ) : (
        <LessonFormView
          courseName={formData.name || ''}
          currentEditingLesson={lessonManagement.currentEditingLesson}
          setCurrentEditingLessonName={lessonManagement.setCurrentEditingLessonName} // Use from hook
          handleSaveNewLesson={lessonManagement.handleSaveNewLesson}
          handleCancelAddLesson={lessonManagement.handleCancelAddLesson}
          handleAddSubLesson={lessonManagement.handleAddSubLesson}
          handleRemoveSubLesson={lessonManagement.handleRemoveSubLesson}
          handleSubLessonNameChange={lessonManagement.handleSubLessonNameChange}
          handleDragEndSubLessons={lessonManagement.handleDragEndSubLessons}
          dndSensors={lessonManagement.sensors}
        />
      )}
    </div>
  );
};

export default EditCoursePage;
