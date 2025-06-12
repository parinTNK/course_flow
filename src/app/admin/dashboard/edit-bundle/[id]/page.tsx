"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEditBundleForm } from "@/app/admin/hooks/useEditBundleForm";
import { BundleBasicFields } from "@/app/admin/components/BundleBasicFields";
import { BundleCourseSelection } from "@/app/admin/components/BundleCourseSelection";
import { useCustomToast } from "@/components/ui/CustomToast";
import ConfirmationModal from "@/app/admin/components/ConfirmationModal";

const EditBundlePage = () => {
  const params = useParams();
  const router = useRouter();

  // ตรวจสอบ params structure
  console.log("📍 Params received:", params);

  // เปลี่ยนให้ใช้ params.id แทน (ตรงกับ folder [id])
  const bundleId = params.id as string;

  console.log("🔍 Bundle ID extracted:", bundleId);

  const { success, error } = useCustomToast();
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // ตรวจสอบว่ามี bundleId หรือไม่
  useEffect(() => {
    if (!bundleId) {
      console.error("❌ No bundle ID found in params:", params);
      error("Error", "Bundle ID not found");
      router.push("/admin/dashboard/bundle");
      return;
    }
  }, [bundleId, params, error, router]);

  const {
    formData,
    availableCourses,
    selectedCourses,
    loading,
    coursesLoading,
    bundleLoading,
    handleInputChange,
    handleAddCourse,
    handleCourseSelect,
    handleDeleteCourse,
    handleCancel,
    handleSubmit,
    getAvailableCoursesForSelection,
    canAddMoreCourses,
  } = useEditBundleForm(bundleId);

  const hasSelectedCourses = formData.course_ids.length > 0;

  // ถ้าไม่มี bundleId ให้แสดง error
  if (!bundleId) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f8f9fa" }}>
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex justify-center items-center h-64">
              <div className="text-red-600">
                <p className="text-lg font-medium">
                  Error: Bundle ID not found
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Please check the URL and try again.
                </p>
                <button
                  onClick={() => router.push("/admin/dashboard/bundle")}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Back to Bundles
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state for bundle data
  if (bundleLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f8f9fa" }}>
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Loading bundle data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleDeleteBundle = async () => {
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/admin/bundle-delete/${bundleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete bundle");
      }

      success(
        "Bundle deleted successfully",
        "The bundle has been removed from the system."
      );

      router.push("/admin/dashboard/bundle");
    } catch (err) {
      error(
        "Failed to delete bundle",
        err instanceof Error ? err.message : "Unknown error"
      );
      console.error("Error deleting bundle:", err);
    } finally {
      setShowDeleteConfirmModal(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteConfirmModal(false);
  };

  return (
    <div className="bg-gray-100 flex-1 pb-10">
      {/* Debug info - ลบออกในโปรดักชัน */}
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <strong>Debug Info:</strong> Bundle ID = {bundleId}, Params ={" "}
        {JSON.stringify(params)}
      </div>

      {/* Header */}
      <div className="bg-white px-8 py-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800">
              Edit Bundle
            </h1>
            <p className="text-gray-600 mt-1">
              Update bundle package information
            </p>
            {formData.name && (
              <p className="text-sm text-gray-500 mt-1">
                Editing: {formData.name}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-2 border border-orange-500 text-orange-500 hover:bg-orange-50 rounded-md font-medium transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !hasSelectedCourses}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>

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
            canAddMoreCourses={canAddMoreCourses}
          />
        </div>

        {/* Delete Bundle Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Delete Bundle
              </h3>
              <p className="text-sm text-gray-500">
                Permanently delete this bundle. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={handleDeleteBundle}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md font-medium transition-colors duration-200"
            >
              Delete Bundle
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading || !hasSelectedCourses}
          className="px-8 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium transition-colors duration-200 disabled:opacity-50"
        >
          {loading ? "Updating Bundle..." : "Update Bundle"}
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Bundle"
        message={`Are you sure you want to delete this bundle: "${formData.name}"?`}
        confirmText="Yes, I want to delete the bundle"
        cancelText="No, keep it"
        requireCourseName={false}
        courseName={formData.name || ""}
        confirmButtonClass="bg-white border border-orange-500 text-orange-500 hover:bg-orange-50"
        cancelButtonClass="bg-blue-600 text-white hover:bg-blue-700"
      />
    </div>
  );
};

export default EditBundlePage;
