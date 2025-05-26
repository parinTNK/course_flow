"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FiPlus } from "react-icons/fi";
import axios from "axios";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import LoadingSpinner from "../../components/LoadingSpinner";
import { ButtonT } from "@/components/ui/ButtonT";
import PromoCodesTable, { PromoCode } from "../../components/PromoCodesTable";
import { useRouter } from "next/navigation";
import { useCustomToast } from "@/components/ui/CustomToast";
import ConfirmationModal from "../../components/ConfirmationModal";

export default function PromoCodesPage() {
  const router = useRouter();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);

  const codesPerPage = 10;
  const { success: toastSuccess, error: toastError } = useCustomToast();

const fetchPromoCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/promocodes", {
        params: {
          page: currentPage,
          limit: codesPerPage,
          search: searchTerm,
        },
      });
      setPromoCodes(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (e: any) {
      setError(e.message || "Failed to fetch promo codes");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, codesPerPage, searchTerm]);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

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
      await axios.delete(`/api/promocodes/delete/${promoId}`);
      toastSuccess("Promo code deleted successfully");
      await fetchPromoCodes();
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
        message={
          <>
            Are you sure you want to delete this promo code:{" "}
            <span className="font-semibold text-red-600">
              {selectedPromo?.code}
            </span>
            ?
          </>
        }
        confirmText="Yes, delete"
        cancelText="Cancel"
        requireCourseName={false}
        courseName={selectedPromo?.code || ""}
      />
    </div>
  );
}
