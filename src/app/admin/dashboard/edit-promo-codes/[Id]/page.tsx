"use client";

import React, { useState } from "react";
import PromoCodeFormView from "../../../components/PromoCodeFormView";
import { useCoursesSelect } from "../../../hooks/useCourseSelect";
import { usePromoCodeForm } from "../../../hooks/usePromoCodeForm";
import { useParams } from "next/navigation";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ConfirmationModal from "../../../components/ConfirmationModal";


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
    handleSubmit,
    handleDeletePromoCode,
  } = usePromoCodeForm({ mode: "edit", id });

  const {
    coursesList,
    filteredCoursesList,
    error: coursesError,
    isLoadingCourses,
    handleToggleCourse,
    handleRemoveTag,
    getSelectedCoursesDisplay,
  } = useCoursesSelect(formData.course_ids, (ids) =>
    setFormData((prev) => ({ ...prev, course_ids: ids })),
    formData.min_purchase_amount
  );
  

  const [showConfirmModal, setShowConfirmModal] = useState(false);


  const onDeletePromoCode = () => {
    setShowConfirmModal(true);
  };


  const handleConfirmDelete = async () => {
    await handleDeletePromoCode();
    setShowConfirmModal(false);
  };


  const handleCloseModal = () => {
    setShowConfirmModal(false);
  };

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
        coursesList={filteredCoursesList}
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
        onDeletePromoCode={onDeletePromoCode}
      />
            <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Promo Code"
        message={`Are you sure you want to delete this promo code: "${formData.code}"?`}
        confirmText="Yes, I want to delete"
        cancelText="No, keep it"
        requireCourseName={false}
        courseName={formData.code || ""}
      />
    </div>
  );
}