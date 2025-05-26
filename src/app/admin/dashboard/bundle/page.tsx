"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BundleWithDetails } from "@/types/bundle";
import { useBundleManagement } from "@/app/admin/hooks/useBundleManagement";
import { BundlePageHeader } from "@/app/admin/components/BundlePageHeader";
import { BundlesTable } from "@/app/admin/components/BundlesTable";
import ConfirmationModal from "@/app/admin/components/ConfirmationModal";

function BundlePackagesPage() {
  const router = useRouter();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBundle, setSelectedBundle] =
    useState<BundleWithDetails | null>(null);

  const {
    filteredBundles,
    loading,
    searchTerm,
    currentPage,
    setSearchTerm,
    handleDelete,
    formatDate,
  } = useBundleManagement();

  const handleEdit = (bundleId: string) => {
    console.log("Edit bundle:", bundleId);
    // Navigate to edit page
    router.push(`/admin/dashboard/edit-bundle/${bundleId}`);
  };

  const handleDeleteClick = (bundleId: string) => {
    const bundle = filteredBundles.find((b) => b.id === bundleId);
    if (bundle) {
      setSelectedBundle(bundle);
      setShowConfirmModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBundle) return;

    const success = await handleDelete(selectedBundle.id);
    if (success) {
      setShowConfirmModal(false);
      setSelectedBundle(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setSelectedBundle(null);
  };

  const handleAddBundle = () => {
    router.push("/admin/dashboard/create-bundle");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="container mx-auto px-4 py-6">
        {/* Header with Search */}
        <BundlePageHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddBundle={handleAddBundle}
        />

        {/* Table */}
        <BundlesTable
          bundles={filteredBundles}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          formatDate={formatDate}
          isLoading={loading}
          currentPage={currentPage}
        />

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Delete Bundle"
          message={`Are you sure you want to delete this bundle: "${selectedBundle?.name}"?`}
          confirmText="Yes, I want to delete the bundle"
          cancelText="No, keep it"
          requireCourseName={false}
        />
      </div>
    </div>
  );
}

export default BundlePackagesPage;
