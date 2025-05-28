import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useCustomToast } from "@/components/ui/CustomToast";
import type { PromoCode } from "@/types/promoCode";

export function usePromoCodes(codesPerPage: number) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useCustomToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);

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

  const deletePromoCode = async (promoId: string) => {
    await axios.delete(`/api/promocodes/delete/${promoId}`);
    await fetchPromoCodes();
  };


  // --- Handlers ---
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

  return {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    promoCodes,
    isLoading,
    error,
    totalPages,
    showConfirmModal,
    selectedPromo,
    handleAddPromoCode,
    handleEditPromoCode,
    handleDeletePromoCode,
    handleCloseAll,
    handleConfirmDelete,
  };
}
