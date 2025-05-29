"use client";

import React from "react";
import PromoCodeFormView from "../../../components/PromoCodeFormView";
import { useCoursesSelect } from "../../../hooks/useCourseSelect";
import { usePromoCodeForm } from "../../../hooks/usePromoCodeForm";
import { useParams } from "next/navigation";
import LoadingSpinner from "../../../components/LoadingSpinner";


export default function EditPromoCodePage() {
  const params = useParams();
  const id = params.Id as string;

  const {
    formData,
    setFormData,
    isLoading,
    errors,
    popoverOpen,
    setPopoverOpen,
    triggerRef,
    triggerWidth,
    handleInputChange,
    handleDiscountTypeChange,
    handleCoursesBlur,
    handlePercentBlur,
    handleCancel,
    handleSubmit
  } = usePromoCodeForm({ mode: "edit", id });

  const {
    coursesList,
    error: coursesError,
    isLoadingCourses,
    handleToggleCourse,
    handleRemoveTag,
    getSelectedCoursesDisplay,
  } = useCoursesSelect(formData.course_ids, (ids) =>
    setFormData((prev) => ({ ...prev, course_ids: ids }))
  );


  const isSaveDisabled = isLoading || isLoadingCourses || (coursesList.length <= 1 && !isLoadingCourses);

  if (isLoadingCourses) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LoadingSpinner text="Loading promo code..." size="md" />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 flex-1 pb-10">
      <PromoCodeFormView
        formData={formData}
        isLoading={isLoading}
        errors={errors}
        coursesList={coursesList}
        popoverOpen={popoverOpen}
        setPopoverOpen={setPopoverOpen}
        triggerRef={triggerRef}
        triggerWidth={triggerWidth}
        getSelectedCoursesDisplay={getSelectedCoursesDisplay}
        handleInputChange={handleInputChange}
        handleDiscountTypeChange={handleDiscountTypeChange}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
        handleCoursesBlur={handleCoursesBlur}
        handleToggleCourse={handleToggleCourse}
        handleRemoveTag={handleRemoveTag}
        handlePercentBlur={handlePercentBlur}
        isCreateDisabled={isSaveDisabled}
        isLoadingCourses={isLoadingCourses}
        mode="edit"
      />
    </div>
  );
}