"use client";

import AssignmentFormView from "../../components/AssignmentFormView";
import { useAssignmentForm } from "../../hooks/useAssignmentForm";

export default function CreateAssignmentPage() {
  const {
    formData,
    setFormData,
    courses,
    lessons,
    subLessons,
    errors,
    isLoading,
    handleInputChange,
    handleSelect,
    handleCancel,
    handleSubmit,
  } = useAssignmentForm();

  return (
    <div className="bg-gray-100 flex-1 pb-10">
      <AssignmentFormView
        formData={formData}
        isLoading={isLoading}
        courses={courses}
        lessons={lessons}
        subLessons={subLessons}
        errors={errors}
        handleInputChange={handleInputChange}
        handleSelect={handleSelect}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
