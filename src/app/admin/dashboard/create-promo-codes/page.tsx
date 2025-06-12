"use client";

import PromoCodeFormView from "../../components/PromoCodeFormView";
import { useCoursesSelect } from "../../hooks/useCourseSelect";
import { usePromoCodeForm } from "../../hooks/usePromoCodeForm";
import { ALL_COURSES_ID, DISCOUNT_TYPE_FIXED } from "@/types/promoCode";


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
    handleFixedBlur,
    handlePercentBlur,
    handleCancel,
    handleSubmit,
    setErrors,
  } = usePromoCodeForm({ mode: "create"});

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


  const isCreateDisabled = isLoading || isLoadingCourses || (coursesList.length <= 1 && !isLoadingCourses);

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
        triggerRef={triggerRef}
        triggerWidth={triggerWidth}
        getSelectedCoursesDisplay={getSelectedCoursesDisplay}
        handleInputChange={handleInputChange}
        handleDiscountTypeChange={handleDiscountTypeChange}
        handleCancel={handleCancel}
        handleSubmit={handleSubmitWithValidate}
        setPopoverOpen={setPopoverOpen}
        handleCoursesBlur={handleCoursesBlur}
        handleToggleCourse={handleToggleCourse}
        handleRemoveTag={handleRemoveTag}
        handlePercentBlur={handlePercentBlur}
        handleFixedBlur={handleFixedBlur}
        isCreateDisabled={isCreateDisabled}
        isLoadingCourses={isLoadingCourses}
      />
    </div>
  );
}

export default CreatePromoCode;
