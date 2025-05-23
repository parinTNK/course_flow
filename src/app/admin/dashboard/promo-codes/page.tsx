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

export default function PromoCodesPage() {
  const router = useRouter();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPromoCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/promocodes");
      setPromoCodes(res.data);
      setTotalPages(1);
    } catch (e: any) {
      setError(e.message || "Failed to fetch promo codes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  console.log("Promo codes:", promoCodes);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const handleAddPromoCode = () => {
    router.push('/admin/dashboard/create-promo-codes');
  };

  const handleEditPromoCode = (id: string) => {
    alert(`Edit promo code ${id} functionality to be implemented`);
  };

  const handleDeletePromoCode = (id: string) => {
    alert(`Delete promo code ${id} functionality to be implemented`);
  };

  const filteredPromoCodes = promoCodes.filter((promo) =>
    promo.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-100 flex-1 h-screen overflow-hidden">
      <div className="flex justify-between items-center mb-8 bg-white px-8 py-6 border-b-3 border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-800">Promo code</h1>
        <div className="flex items-center space-x-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
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
        {isLoading && <LoadingSpinner text="Loading promo codes..." size="md" />}
        {error && (
          <div className="text-center py-10 text-red-600 bg-red-100 p-4 rounded-md">
            Error: {error}
          </div>
        )}

        {!isLoading && !error && (
          <PromoCodesTable
            promoCodes={filteredPromoCodes}
            isLoading={isLoading}
            currentPage={currentPage}
            onEditPromoCode={handleEditPromoCode}
            onDeletePromoCode={handleDeletePromoCode}
          />
        )}

        {filteredPromoCodes.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}