'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CourseFormView } from '@/app/admin/components/CourseFormView';
import { LessonFormView } from '@/app/admin/components/LessonFormView';
import { Lesson } from '@/types/courseAdmin';
import { useCustomToast } from '@/components/ui/CustomToast';
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCourseForm } from '@/app/admin/hooks/useCourseForm';
import { useLessonManagement } from '@/app/admin/hooks/useLessonManagement';
import StudentSubscriptionWarningModal from '@/app/admin/components/StudentSubscriptionWarningModal';
import ConfirmationModal from '@/app/admin/components/ConfirmationModal';

const EditCoursePage = () => {
  const params = useParams();
  const router = useRouter();
  const { courseId } = params;
  const { success, error } = useCustomToast();

  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);

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
    handleCoverRemove,
    handleInputChange,
    handleSubmit,
    handleCancel,
    handleVideoUploadSuccess,
    handleVideoUploadError,
    handleVideoDelete,
    originalVideoData,
    setOriginalVideoData,
    videoMarkedForDeletion,
    handlePromoCodeChange,
    updatePromoMinPurchase,
    videoUploadState,
    handleVideoUploadStateChange,
    cancelVideoUpload,
  } = useCourseForm({ courseId: courseId as string });


  const lessonManagement = useLessonManagement('');


  useEffect(() => {
    if (formData.name) {
      lessonManagement.updateCourseName(formData.name);
    }
  }, [formData.name, lessonManagement]);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/courses/${courseId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch course data');
        }
        const data = await response.json();

        const formDataToSet = {
          id: courseId as string,
          name: data.name || '',
          price: data.price || 0,
          total_learning_time: data.total_learning_time || 0,
          summary: data.summary || '',
          detail: data.detail || '',
          status: data.status || 'draft',
          cover_image_url: data.cover_image_url || null,
          promo_code_id: data.promo_code_id || null,
          video_trailer_mux_asset_id: data.video_trailer_mux_asset_id || null,
          video_trailer_url: data.video_trailer_url || null,
        };

        if (!initialDataLoaded) {
          setFormData(formDataToSet);
        }


        const normalizedLessons = (data.lessons_attributes || data.lessons || []).map(lesson => {
          const subLessonsSource =
            lesson.sub_lessons_attributes || lesson.subLessons || lesson.sub_lessons || [];

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
            sub_lessons_attributes: normalizedSubLessons,
            subLessons: normalizedSubLessons,
            sub_lessons: normalizedSubLessons
          };
        });

        lessonManagement.setLessons(normalizedLessons);


        if (data.cover_image_url) {
          setCoverPreview(data.cover_image_url);
        }

        setInitialDataLoaded(true);
      } catch (error: any) {
        console.error('Error fetching course:', error);
        error('Error', 'Could not load course data.');
      }
      setIsLoading(false);
    };

    fetchCourseData();
  }, [courseId, setFormData, setCoverPreview, setIsLoading, lessonManagement.setLessons]);

  const handleDragEndLessons = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      lessonManagement.setLessons((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newItems = Array.from(items);
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  };

  if (isLoading && !initialDataLoaded) {
    return <div className="flex justify-center items-center h-screen"><p>Loading course data...</p></div>;
  }

  const handleCancelWithCleanup = async () => {
    try {
      await lessonManagement.cancelAllUploads();
    } catch (error) {
      console.error('❌ EditCourse: Error cancelling sub-lesson uploads:', error);
    }

    handleCancel();
  };

  const submitHandler = (e: React.FormEvent, status: 'draft' | 'published', validateNameOnlyFlag = false) => {
    handleSubmit(e, status, lessonManagement.lessons, validateNameOnlyFlag);
  };

  const checkSubscription = async (courseId: string) => {
    const res = await fetch(`/api/admin/courses/${courseId}/has-subscription`);
    const data = await res.json();
    return data.hasSubscription;
  };

  const handleDeleteCourse = async () => {
    if (!courseId) return;
    setShowDeleteConfirmModal(true);
  };

  const handleActualDeleteCourse = async (courseIdToDelete: string) => {
    try {
      const response = await fetch(
        `/api/admin/courses-delete/${courseIdToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete course");
      }

      success(
        "Course deleted successfully",
        "The course has been removed from the system."
      );

      router.push('/admin/dashboard?refresh=true');
    } catch (err) {
      error(
        "Failed to delete course",
        err instanceof Error ? err.message : "Unknown error"
      );
      console.error("Error deleting course:", err);
    } finally {
      handleCloseAll();
    }
  };

  const handleProceedWarning = () => {
    if (!courseId) return;
    handleActualDeleteCourse(courseId as string);
  };

  const handleCloseAll = () => {
    setShowWarningModal(false);
    setShowDeleteConfirmModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!courseId) return;
    const hasSub = await checkSubscription(courseId as string);
    setHasSubscription(hasSub);
    if (hasSub) {
      setShowDeleteConfirmModal(false);
      setShowWarningModal(true);
    } else {
      handleActualDeleteCourse(courseId as string);
    }
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
          handleSubmit={submitHandler}
          handleCancel={handleCancelWithCleanup}
          onDeleteCourse={handleDeleteCourse}
          handleAddLesson={lessonManagement.handleAddLesson}
          handleDeleteLesson={lessonManagement.handleDeleteLesson}
          handleEditLesson={lessonManagement.handleEditLesson}
          handleDragEndLessons={handleDragEndLessons}
          handleVideoUploadSuccess={handleVideoUploadSuccess}
          handleVideoUploadError={handleVideoUploadError}
          handleVideoDelete={handleVideoDelete}
          videoMarkedForDeletion={videoMarkedForDeletion}
          dndSensors={sensors}
          videoUploadState={videoUploadState}
          handleVideoUploadStateChange={handleVideoUploadStateChange}
          cancelVideoUpload={cancelVideoUpload}
          handlePromoCodeChange={handlePromoCodeChange}
          updatePromoMinPurchase={updatePromoMinPurchase}
        />
      ) : (
        <LessonFormView
          courseName={formData.name || ''}
          currentEditingLesson={lessonManagement.currentEditingLesson}
          setCurrentEditingLessonName={lessonManagement.setCurrentEditingLessonName}
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
        />
      )}

      <StudentSubscriptionWarningModal
        isOpen={showWarningModal}
        onClose={handleCloseAll}
        onProceed={handleProceedWarning}
        courseName={formData.name || ""}
      />
      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={handleCloseAll}
        onConfirm={handleConfirmDelete}
        title="Delete Course"
        message={`Are you sure you want to delete this course: "${formData.name}"?`}
        confirmText="Yes, I want to delete the course"
        cancelText="No, keep it"
        requireCourseName={false}
        courseName={formData.name || ""}
        confirmButtonClass="bg-white border border-orange-500 text-orange-500 hover:bg-orange-50"
        cancelButtonClass="bg-blue-600 text-white hover:bg-blue-700"
      />
    </div>
  );
};

export default EditCoursePage;
