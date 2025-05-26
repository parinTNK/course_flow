import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { PromoCode } from "../components/PromoCodesTable";

export function usePromoCodes(
  codesPerPage: number,
  searchTerm: string,
  currentPage: number
) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

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

  return {
    promoCodes,
    isLoading,
    error,
    totalPages,
    fetchPromoCodes,
    deletePromoCode,
  };
}
