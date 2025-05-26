"use client";

import React, { useState} from "react";
import { useRouter } from "next/navigation";
import { FiPlus } from "react-icons/fi";
import { ButtonT } from "@/components/ui/ButtonT";

import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import LoadingSpinner from "../../components/LoadingSpinner";
import PromoCodesTable, { PromoCode } from "../../components/PromoCodesTable";
import ConfirmationModal from "../../components/ConfirmationModal";
import { useCustomToast } from "@/components/ui/CustomToast";
import { usePromoCodes } from "../../hooks/usePromoCodes";

export default function PromoCodesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);

  const { success: toastSuccess, error: toastError } = useCustomToast();
  const codesPerPage = 12;

  const {
    promoCodes,
    isLoading,
    error,
    totalPages,
    fetchPromoCodes,
    deletePromoCode,
  } = usePromoCodes(codesPerPage, searchTerm, currentPage);


  const handleAddPromoCode = () => {
    router.push("/admin/dashboard/create-promo-codes");
  };

  const handleEditPromoCode = (id: string) => {
    alert(`Edit promo code ${id} functionality to be implemented`);
  };

  const handleDeletePromoCode = (promo: PromoCode) => {
    setSelectedPromo(promo);
    setShowConfirmModal(true);
  };

  const handleCloseAll = () => {
    setShowConfirmModal(false);
    setSelectedPromo(null);
  };

  const handleActualDeletePromo = async (promoId: string) => {
    try {
      await deletePromoCode(promoId);
      toastSuccess("Promo code deleted successfully");
    } catch (e: any) {
      toastError(e.message || "Failed to delete promo code");
    } finally {
      handleCloseAll();
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPromo) return;
    await handleActualDeletePromo(selectedPromo.id);
  };

  return (
    <div className="bg-gray-100 flex-1 h-screen overflow-hidden">
      <div className="flex justify-between items-center mb-8 bg-white px-8 py-6 border-b-3 border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-800">Promo code</h1>
        <div className="flex items-center space-x-4">
          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search..."
            className="w-64"
          />
          <ButtonT
            onClick={handleAddPromoCode}
            className="w-[250px] flex justify-center items-center gap-3 bg-blue-600 text-white"
          >
            <FiPlus size={20} />
            <span>Add Promo code</span>
          </ButtonT>
        </div>
      </div>
      <div className="px-8 pb-8">
        {isLoading && (
          <LoadingSpinner text="Loading promo codes..." size="md" />
        )}
        {error && (
          <div className="text-center py-10 text-red-600 bg-red-100 p-4 rounded-md">
            Error: {error}
          </div>
        )}

        {!isLoading && !error && (
          <PromoCodesTable
            promoCodes={promoCodes}
            isLoading={isLoading}
            currentPage={currentPage}
            onEditPromoCode={handleEditPromoCode}
            onDeletePromoCode={handleDeletePromoCode}
          />
        )}

        {promoCodes.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseAll}
        onConfirm={handleConfirmDelete}
        title="Delete Promo Code"
        message={`Are you sure you want to delete this promo code: "${selectedPromo?.code}"?`}
        confirmText="Yes, I want to delete"
        cancelText="No, keep it"
        requireCourseName={false}
        courseName={selectedPromo?.code || ""}
      />
    </div>
  );
}
