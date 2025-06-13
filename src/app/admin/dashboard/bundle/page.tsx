"use client";

import React, { useState, useCallback } from "react";
import { FiPlus } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { BundleWithDetails } from "@/types/bundle";
import { useBundleManagement } from "@/app/admin/hooks/useBundleManagement";
import { BundlesTable } from "@/app/admin/components/BundlesTable";
import ConfirmationModal from "@/app/admin/components/ConfirmationModal";
import SearchBar from "@/app/admin/components/SearchBar";
import LoadingSpinner from "@/app/admin/components/LoadingSpinner";
import Pagination from "@/app/admin/components/Pagination";
import { ButtonT } from "@/components/ui/ButtonT";

export default function BundlePackagesPage() {
  const router = useRouter();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBundle, setSelectedBundle] =
    useState<BundleWithDetails | null>(null);

  const bundlesPerPage = 10;

  const {
    filteredBundles,
    allFilteredBundles,
    loading,
    error,
    searchTerm,
    currentPage,
    totalPages,
    setSearchTerm,
    setCurrentPage,
    handleDelete,
    formatDate,
  } = useBundleManagement(bundlesPerPage);

  const handleEdit = useCallback(
    (bundleId: string) => {
      console.log("Edit bundle:", bundleId);
      router.push(`/admin/dashboard/edit-bundle/${bundleId}`);
    },
    [router]
  );

  const handleDeleteClick = useCallback(
    (bundleId: string) => {
      const bundle = allFilteredBundles.find((b) => b.id === bundleId);
      if (bundle) {
        setSelectedBundle(bundle);
        setShowConfirmModal(true);
      }
    },
    [allFilteredBundles]
  );

  const handleConfirmDelete = async () => {
    if (!selectedBundle) return;

    const success = await handleDelete(selectedBundle.id);
    if (success) {
      setShowConfirmModal(false);
      setSelectedBundle(null);
    }
  };

  const handleCloseAll = useCallback(() => {
    setShowConfirmModal(false);
    setSelectedBundle(null);
  }, []);

  const handleAddBundle = useCallback(() => {
    router.push("/admin/dashboard/create-bundle");
  }, [router]);

  return (
    <div className="bg-gray-100 flex-1 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 bg-white px-4 sm:px-8 py-6 border-b-3 border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-800">
          Bundle Packages
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search bundles..."
            className="w-full sm:w-64 md:w-72"
          />
          <ButtonT
            onClick={handleAddBundle}
            className="w-full sm:w-auto px-4 py-2 flex justify-center items-center gap-3"
          >
            <FiPlus size={20} />
            <span>Add Bundle</span>
          </ButtonT>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 pb-8">
        {loading && <LoadingSpinner text="Loading bundles..." size="md" />}

        {error && (
          <div className="text-center py-10 text-red-600 bg-red-100 p-4 rounded-md">
            Can't load bundle packages. Please try again later.
            {error && (
              <div className="text-xs text-gray-500 mt-2">Details: {error}</div>
            )}
          </div>
        )}

        {!loading && !error && (
          <BundlesTable
            bundles={filteredBundles}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            formatDate={formatDate}
            isLoading={loading}
            currentPage={currentPage}
          />
        )}

        {allFilteredBundles.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseAll}
        onConfirm={handleConfirmDelete}
        title="Delete Bundle Package"
        message={`Are you sure you want to delete this bundle package: "${selectedBundle?.name}"?`}
        confirmText="Yes, I want to delete"
        cancelText="No, keep it"
        requireCourseName={false}
        courseName={selectedBundle?.name || ""}
      />
    </div>
  );
}
