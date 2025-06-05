"use client";

import React, { useState } from "react";
import PromoCodeFormView from "../../../components/PromoCodeFormView";
import { useCoursesSelect } from "../../../hooks/useCourseSelect";
import { usePromoCodeForm } from "../../../hooks/usePromoCodeForm";
import { useParams } from "next/navigation";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ConfirmationModal from "../../../components/ConfirmationModal";
import { ALL_COURSES_ID, DISCOUNT_TYPE_FIXED } from "@/types/promoCode";

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
    setErrors,
  } = usePromoCodeForm({ mode: "edit", id });

  const {
    coursesList,
    filteredCoursesList,
    error: coursesError,
    isLoadingCourses,
    handleToggleCourse,
    handleRemoveTag,
    getSelectedCoursesDisplay,
  } = useCoursesSelect(
    formData.course_ids,
    (ids) => setFormData((prev) => ({ ...prev, course_ids: ids })),
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

  const isSaveDisabled =
    isLoading ||
    isLoadingCourses ||
    (coursesList.length <= 1 && !isLoadingCourses);

  if (isLoadingCourses) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LoadingSpinner text="Loading promo code..." size="md" />
      </div>
    );
  }

  const validateFixedDiscount = () => {
    if (formData.discount_type === DISCOUNT_TYPE_FIXED) {
      const discount = Number(formData.discount_value);
      const selectedCourses = coursesList.filter((course) =>
        formData.course_ids.includes(course.id)
      );
      const invalidCourses = selectedCourses.filter(
        (course) =>
          course.id !== ALL_COURSES_ID && Number(course.price) < discount
      );

      console.log(
        "Selected courses for fixed discount validation:",
        selectedCourses
      );
      console.log("Invalid courses found:", invalidCourses);

      if (invalidCourses.length > 0) {
        const courseList = invalidCourses
          .map((course) => `"${course.name}" (price: ${course.price})`)
          .join(", ");
        return `Discount amount (${discount}) must not exceed course price for: ${courseList}`;
      }
    }
    return null;
  };

  const handleSubmitWithValidate = (e: React.FormEvent) => {
    const errorMsg = validateFixedDiscount();
    if (errorMsg) {
      setErrors((prev) => ({ ...prev, discount_value: errorMsg }));
      return;
    }
    handleSubmit(e);
  };

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
        handleSubmit={handleSubmitWithValidate}
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
