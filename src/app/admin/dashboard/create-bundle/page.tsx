"use client";

import React from "react";
import { useBundleForm } from "@/app/admin/hooks/useBundleForm";
import { BundleFormHeader } from "../../components/BundleFormHeader";
import { BundleBasicFields } from "../../components/BundleBasicFields";
import { BundleCourseSelection } from "../../components/BundleCourseSelection";
import { ButtonT } from "@/components/ui/ButtonT";

function CreateBundlePage() {
  const {
    formData,
    availableCourses,
    selectedCourses,
    loading,
    coursesLoading,
    handleInputChange,
    handleAddCourse,
    handleCourseSelect,
    handleDeleteCourse,
    handleCancel,
    handleSubmit,
    getAvailableCoursesForSelection,
    canAddMoreCourses, // เพิ่มใหม่
  } = useBundleForm();

  const hasSelectedCourses = formData.course_ids.length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <BundleFormHeader
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          loading={loading}
          hasSelectedCourses={hasSelectedCourses}
        />

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="max-w-4xl">
            {/* Basic Fields */}
            <BundleBasicFields
              formData={formData}
              onInputChange={handleInputChange}
            />

            {/* Course Selection */}
            <BundleCourseSelection
              availableCourses={availableCourses}
              selectedCourses={selectedCourses}
              coursesLoading={coursesLoading}
              onAddCourse={handleAddCourse}
              onCourseSelect={handleCourseSelect}
              onDeleteCourse={handleDeleteCourse}
              getAvailableCoursesForSelection={getAvailableCoursesForSelection}
              canAddMoreCourses={canAddMoreCourses} // เพิ่มใหม่
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateBundlePage;
