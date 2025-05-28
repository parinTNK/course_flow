"use client";

import PromoCodeFormView from "../../components/PromoCodeFormView";
import { useCoursesSelect } from "../../hooks/useCourseSelect";
import { usePromoCodeForm } from "../../hooks/usePromoCodeForm";

function CreatePromoCode() {
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
  } = usePromoCodeForm();

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

  const isCreateDisabled =
    isLoading ||
    isLoadingCourses ||
    (coursesList.length <= 1 && !isLoadingCourses);

  return (
    <div className="bg-gray-100 flex-1 pb-10">
      <PromoCodeFormView
        formData={formData}
        isLoading={isLoading}
        errors={errors}
        coursesList={coursesList}
        popoverOpen={popoverOpen}
        triggerRef={triggerRef}
        triggerWidth={triggerWidth}
        getSelectedCoursesDisplay={getSelectedCoursesDisplay}
        handleInputChange={handleInputChange}
        handleDiscountTypeChange={handleDiscountTypeChange}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
        setPopoverOpen={setPopoverOpen}
        handleCoursesBlur={handleCoursesBlur}
        handleToggleCourse={handleToggleCourse}
        handleRemoveTag={handleRemoveTag}
        handlePercentBlur={handlePercentBlur}
        isCreateDisabled={isCreateDisabled}
        isLoadingCourses={isLoadingCourses}
      />
    </div>
  );
}

export default CreatePromoCode;
